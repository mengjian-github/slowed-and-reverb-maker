export type MediaHighlight = { text: string; start: number; end: number; sourceChunkIndices: number[] };
export type MediaTranscript = { kind: "extractive-highlights"; transcript: string; durationSeconds: number; highlights: MediaHighlight[] };
export type MediaTranscriptionOptions = { signal?: AbortSignal; onProgress?: (phase: "decoding" | "loading" | "transcribing") => void };
type Reply = { id: number; ok?: boolean; type?: string; phase?: "loading" | "transcribing"; error?: string; partialTranscript?: unknown; highlights?: MediaTranscript };

/** A failed transcription may retain unverified text for manual review.
 * This is never a successful MediaTranscript and has no usable timestamps.
 */
export class MediaTranscriptionError extends Error {
  readonly code = "transcript_incomplete";
  readonly partialTranscript?: string;

  constructor(partialTranscript?: unknown) {
    const partial = typeof partialTranscript === "string" && partialTranscript.length <= 20000 ? partialTranscript.trim() : "";
    super(partial
      ? "We couldn't produce reliable transcript timings. Review the unverified partial transcript or try another recording."
      : "We couldn't produce a complete transcript. Try another recording.");
    this.name = "MediaTranscriptionError";
    if (partial) this.partialTranscript = partial;
  }
}

function transcriptionFailure(reply: Reply): Error {
  if (typeof reply.error === "string" && /^transcript_(?:limits_invalid|structure_invalid|chunk_invalid|timeline_incomplete|text_not_covered)$/.test(reply.error)) {
    return new MediaTranscriptionError(reply.partialTranscript);
  }
  return new Error(reply.error === "No speech detected" ? "No speech detected" : "Unable to transcribe this recording. Try again or choose another recording.");
}

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_SECONDS = 120;
const abortError = () => new DOMException("Transcription cancelled", "AbortError");

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener("abort", abort); reject(abortError()); };
    signal.addEventListener("abort", abort, { once: true });
    promise.then(value => { signal.removeEventListener("abort", abort); resolve(value); }, error => { signal.removeEventListener("abort", abort); reject(error); });
  });
}

async function mediaDuration(file: File, signal?: AbortSignal): Promise<number> {
  const url = URL.createObjectURL(file), media = document.createElement("audio");
  try {
    return await new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); media.onloadedmetadata = null; media.onerror = null; };
      const abort = () => { cleanup(); reject(abortError()); };
      const timer = setTimeout(() => { cleanup(); reject(new Error("Media metadata timed out")); }, 15000);
      media.onloadedmetadata = () => { const duration = media.duration; cleanup(); Number.isFinite(duration) && duration > 0 && duration <= MAX_SECONDS ? resolve(duration) : reject(new Error("Use a recording of at most 2 minutes")); };
      media.onerror = () => { cleanup(); reject(new Error("Unable to read this recording")); };
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) { abort(); return; }
      media.preload = "metadata"; media.src = url;
    });
  } finally { media.removeAttribute("src"); media.load(); URL.revokeObjectURL(url); }
}

/** Local English speech transcription with extractive source passages.
 * Timings refer to decoded audio; the caller owns output reset and review UI.
 */
export function createMediaTranscriber() {
  let worker: Worker | null = null, loaded = false, busy = false, disposed = false, sequence = 0;
  let activeController: AbortController | null = null;
  const pending = new Map<number, { resolve: (reply: Reply) => void; reject: (error: Error) => void; progress?: MediaTranscriptionOptions["onProgress"] }>();
  function stop(error: Error) {
    worker?.terminate(); worker = null; loaded = false;
    for (const job of pending.values()) job.reject(error);
    pending.clear();
  }
  function call(type: "load" | "transcribe", audio?: Float32Array<ArrayBuffer>, progress?: MediaTranscriptionOptions["onProgress"]): Promise<Reply> {
    if (!worker) {
      worker = new Worker("/__shipsite/media/worker.mjs", { type: "module" });
      worker.onmessage = ({ data }: MessageEvent<Reply>) => {
        const job = pending.get(data.id); if (!job) return;
        if (data.type === "progress") { if (data.phase) job.progress?.(data.phase); return; }
        pending.delete(data.id); job.resolve(data);
      };
      worker.onerror = () => stop(new Error("Media runtime could not start"));
    }
    const id = ++sequence;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject, progress }); worker!.postMessage({ id, type, audio }, audio ? [audio.buffer] : []); });
  }
  return {
    async transcribe(file: File, options: MediaTranscriptionOptions = {}): Promise<MediaTranscript> {
      if (disposed) throw new Error("Media transcriber is disposed");
      if (busy) throw new Error("A transcription is already running");
      if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) throw new Error("Choose a non-empty recording no larger than 10 MB");
      if (!/\.(wav|webm)$/i.test(file.name)) throw new Error("Choose a WAV or WebM recording");
      options.signal?.throwIfAborted(); busy = true;
      const controller = new AbortController(); activeController = controller;
      const signal = controller.signal;
      const forwardAbort = () => controller.abort();
      options.signal?.addEventListener("abort", forwardAbort, { once: true });
      const abort = () => stop(abortError());
      signal.addEventListener("abort", abort, { once: true });
      try {
        options.onProgress?.("decoding"); await mediaDuration(file, signal); signal.throwIfAborted();
        const context = new AudioContext({ sampleRate: 16000 });
        let decoded: AudioBuffer;
        try { decoded = await abortable(context.decodeAudioData(await abortable(file.arrayBuffer(), signal)), signal); } finally { await context.close(); }
        signal.throwIfAborted();
        if (disposed) throw new Error("Media transcriber is disposed");
        if (!decoded.length || decoded.duration > MAX_SECONDS || decoded.numberOfChannels > 8) throw new Error("Recording exceeds the supported audio limits");
        const pcm = new Float32Array(decoded.length);
        for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
          const samples = decoded.getChannelData(channel);
          for (let index = 0; index < samples.length; index++) pcm[index] += samples[index] / decoded.numberOfChannels;
        }
        if (!loaded) {
          options.onProgress?.("loading");
          signal.throwIfAborted();
          const response = await call("load", undefined, options.onProgress);
          if (!response.ok) { const error = new Error("The transcription model could not load. Check your connection and try again."); stop(error); throw error; }
          loaded = true;
        }
        signal.throwIfAborted();
        options.onProgress?.("transcribing");
        signal.throwIfAborted();
        const response = await call("transcribe", pcm, options.onProgress);
        signal.throwIfAborted();
        if (!response.ok || !response.highlights) throw transcriptionFailure(response);
        return response.highlights;
      } finally { busy = false; activeController = null; options.signal?.removeEventListener("abort", forwardAbort); signal.removeEventListener("abort", abort); }
    },
    dispose() { disposed = true; activeController?.abort(); stop(abortError()); },
  };
}
