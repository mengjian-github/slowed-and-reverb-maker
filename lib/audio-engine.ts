// Browser audio engine for Slowed and Reverb Maker.
// Speed, pitch, reverb and bass run on the Web Audio graph the visitor's
// browser already has. Nothing here uploads audio or reads a canned sample.

export type PresetId = "none" | "classic" | "nightcore" | "daycore";
export type ExportFormat = "wav" | "mp3";

export interface ShapeSettings {
  preset: PresetId;
  speed: number;
  pitch: number;
  reverbPct: number;
  bassDb: number;
  trimStart: number;
  trimEnd: number;
}

export interface LoadedTrack {
  name: string;
  format: string;
  duration: number;
  buffer: AudioBuffer;
  peaks: number[];
}

export const SPEED_MIN = 0.5;
export const SPEED_MAX = 1.5;
export const PITCH_MIN = -12;
export const PITCH_MAX = 12;
export const REVERB_MIN = 0;
export const REVERB_MAX = 100;
export const BASS_MIN = 0;
export const BASS_MAX = 12;

export const PRESETS: Record<Exclude<PresetId, "none">, Omit<ShapeSettings, "preset" | "trimStart" | "trimEnd">> = {
  classic: { speed: 0.8, pitch: -2, reverbPct: 55, bassDb: 4 },
  nightcore: { speed: 1.25, pitch: 4, reverbPct: 12, bassDb: 0 },
  daycore: { speed: 0.75, pitch: -5, reverbPct: 40, bassDb: 4 },
};

export const PRESET_LABEL: Record<PresetId, string> = {
  none: "Custom",
  classic: "Classic Slowed + Reverb",
  nightcore: "Nightcore",
  daycore: "Daycore",
};

export const ACCEPTED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/ogg", "audio/flac", "audio/x-flac"];
export const ACCEPTED_EXT = ["mp3", "wav", "m4a", "ogg", "flac", "aac"];

const FORMAT_BY_EXT: Record<string, string> = {
  mp3: "MP3", wav: "WAV", m4a: "M4A", aac: "M4A", ogg: "OGG", flac: "FLAC",
};

export function formatFromName(name: string, mime: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (FORMAT_BY_EXT[ext]) return FORMAT_BY_EXT[ext];
  if (/wav/i.test(mime)) return "WAV";
  if (/mpeg|mp3/i.test(mime)) return "MP3";
  if (/mp4|m4a/i.test(mime)) return "M4A";
  if (/ogg/i.test(mime)) return "OGG";
  if (/flac/i.test(mime)) return "FLAC";
  return ext ? ext.toUpperCase() : "AUDIO";
}

export function isAcceptedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ACCEPTED_EXT.includes(ext)) return true;
  return ACCEPTED_TYPES.includes(file.type);
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function parseNumber(raw: string): number | null {
  const text = raw.trim();
  if (!text || text === "-" || text === "." || text === "-.") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0 s";
  if (seconds < 60) {
    const rounded = Math.round(seconds);
    return rounded === seconds || Math.abs(seconds - rounded) < 0.05 ? `${rounded} s` : `${seconds.toFixed(1)} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function speedError(raw: string): string | null {
  const value = parseNumber(raw);
  if (value === null) return "Enter a speed between 0.5 and 1.5";
  if (value < SPEED_MIN || value > SPEED_MAX) return "Speed must be between 0.5 and 1.5";
  return null;
}

export function pitchError(raw: string): string | null {
  const value = parseNumber(raw);
  if (value === null) return "Enter a pitch between -12 and 12 semitones";
  if (value < PITCH_MIN || value > PITCH_MAX) return "Pitch must be between -12 and 12 semitones";
  return null;
}

export function reverbError(raw: string): string | null {
  const value = parseNumber(raw);
  if (value === null) return "Enter a reverb between 0 and 100";
  if (value < REVERB_MIN || value > REVERB_MAX) return "Reverb must be between 0% and 100%";
  return null;
}

export function bassError(raw: string): string | null {
  const value = parseNumber(raw);
  if (value === null) return "Enter a bass boost between 0 and 12 dB";
  if (value < BASS_MIN || value > BASS_MAX) return "Bass boost must be between 0 and 12 dB";
  return null;
}

/** A four-second stereo pad, so the console is playable before a file is chosen. */
export function makeSampleBuffer(): AudioBuffer {
  const sampleRate = 44100;
  const length = sampleRate * 4;
  const buffer = new AudioBuffer({ length, numberOfChannels: 2, sampleRate });
  const tones = [110, 220, 261.63, 329.63, 440];
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const env = Math.min(t / 0.7, 1) * Math.pow(1 - t / 4, 1.4);
      let value = 0;
      for (let k = 0; k < tones.length; k += 1) {
        const detune = 1 + (channel ? 0.0018 : -0.0018) * (k % 2 ? 1 : -1);
        value += Math.sin(2 * Math.PI * tones[k] * detune * t + Math.sin(2 * Math.PI * 0.6 * t + k * 1.3) * 0.5) / (k + 2);
      }
      data[i] = value * env * 0.55;
    }
  }
  return buffer;
}

export function peaksFromBuffer(buffer: AudioBuffer, bars = 160): number[] {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / bars));
  const peaks: number[] = [];
  let loudest = 0.0001;
  for (let bar = 0; bar < bars; bar += 1) {
    let peak = 0;
    const start = bar * step;
    const end = Math.min(data.length, start + step);
    const hop = Math.max(1, Math.floor((end - start) / 48));
    for (let i = start; i < end; i += hop) {
      const value = Math.abs(data[i]);
      if (value > peak) peak = value;
    }
    peaks.push(peak);
    if (peak > loudest) loudest = peak;
  }
  return peaks.map((peak) => peak / loudest);
}

export function decodeFile(file: File): Promise<LoadedTrack> {
  return file.arrayBuffer().then((bytes) => {
    const context = new AudioContext();
    return context.decodeAudioData(bytes.slice(0)).then(
      (buffer) => {
        void context.close();
        return {
          name: file.name,
          format: formatFromName(file.name, file.type),
          duration: buffer.duration,
          buffer,
          peaks: peaksFromBuffer(buffer),
        };
      },
      () => {
        void context.close();
        throw new Error("Could not decode this file. Try MP3, WAV, M4A, OGG or FLAC.");
      },
    );
  });
}

/** Exponential room impulse: the reverb tail the convolver plays. */
export function makeImpulse(context: BaseAudioContext, seconds = 2.1): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const decay = Math.pow(1 - i / length, 2.6);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
  }
  return impulse;
}

export interface GraphNodes {
  source: AudioBufferSourceNode;
  bass: BiquadFilterNode;
  dry: GainNode;
  wet: GainNode;
}

export function wireGraph(context: BaseAudioContext, buffer: AudioBuffer, settings: ShapeSettings, destination: AudioNode): GraphNodes {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = settings.speed;
  source.detune.value = settings.pitch * 100;

  const bass = context.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 150;
  bass.gain.value = settings.bassDb;

  const dry = context.createGain();
  const wet = context.createGain();
  const mix = clamp(settings.reverbPct, 0, 100) / 100;
  dry.gain.value = 1 - mix * 0.55;
  wet.gain.value = mix;

  const convolver = context.createConvolver();
  convolver.buffer = makeImpulse(context);

  source.connect(bass);
  bass.connect(dry);
  bass.connect(convolver);
  convolver.connect(wet);
  dry.connect(destination);
  wet.connect(destination);
  return { source, bass, dry, wet };
}

export function applyLive(nodes: GraphNodes, settings: ShapeSettings) {
  const mix = clamp(settings.reverbPct, 0, 100) / 100;
  nodes.source.playbackRate.setTargetAtTime(settings.speed, nodes.source.context.currentTime, 0.03);
  nodes.source.detune.setTargetAtTime(settings.pitch * 100, nodes.source.context.currentTime, 0.03);
  nodes.bass.gain.setTargetAtTime(settings.bassDb, nodes.bass.context.currentTime, 0.03);
  nodes.dry.gain.setTargetAtTime(1 - mix * 0.55, nodes.dry.context.currentTime, 0.04);
  nodes.wet.gain.setTargetAtTime(mix, nodes.wet.context.currentTime, 0.04);
}

export function sliceBuffer(buffer: AudioBuffer, start: number, end: number): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const from = clamp(Math.floor(start * sampleRate), 0, buffer.length - 1);
  const to = clamp(Math.floor(end * sampleRate), from + 1, buffer.length);
  const sliced = new AudioBuffer({ length: to - from, numberOfChannels: buffer.numberOfChannels, sampleRate });
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    sliced.getChannelData(channel).set(buffer.getChannelData(channel).subarray(from, to));
  }
  return sliced;
}

export interface RenderedAudio {
  buffer: AudioBuffer;
  duration: number;
}

/** Offline render of the same graph the preview plays, so the file matches the ear. */
export async function renderOffline(source: AudioBuffer, settings: ShapeSettings, onProgress?: (ratio: number) => void): Promise<RenderedAudio> {
  const span = Math.max(0.05, settings.trimEnd - settings.trimStart);
  const tail = settings.reverbPct > 0 ? 1.6 : 0.05;
  const duration = span / Math.max(settings.speed, 0.05) + tail;
  const length = Math.ceil(duration * source.sampleRate);
  const context = new OfflineAudioContext(source.numberOfChannels, length, source.sampleRate);
  const trimmed = sliceBuffer(source, settings.trimStart, settings.trimEnd);
  const graph = wireGraph(context, trimmed, settings, context.destination);
  graph.source.start(0);
  let timer = 0;
  if (onProgress && typeof window !== "undefined") {
    const started = performance.now();
    timer = window.setInterval(() => {
      const ratio = Math.min(0.92, (performance.now() - started) / Math.max(900, duration * 280));
      onProgress(ratio);
    }, 120);
  }
  try {
    const buffer = await context.startRendering();
    onProgress?.(1);
    return { buffer, duration: buffer.duration };
  } finally {
    if (timer) window.clearInterval(timer);
  }
}

export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const bytes = new ArrayBuffer(44 + length * channels * 2);
  const view = new DataView(bytes);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + length * channels * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, length * channels * 2, true);
  let offset = 44;
  const planes = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  for (let i = 0; i < length; i += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, planes[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
      offset += 2;
    }
  }
  return new Blob([bytes], { type: "audio/wav" });
}

function floatToInt16(data: Float32Array): Int16Array {
  const out = new Int16Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    out[i] = sample < 0 ? sample * 32768 : sample * 32767;
  }
  return out;
}

/** LAME MP3 encode (lamejs, LGPL). Stereo is interleaved into two planes first. */
export async function encodeMp3(buffer: AudioBuffer, kbps = 192): Promise<Blob> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const channels = Math.min(2, buffer.numberOfChannels);
  const left = floatToInt16(buffer.getChannelData(0));
  const right = channels > 1 ? floatToInt16(buffer.getChannelData(1)) : left;
  const encoder = new Mp3Encoder(channels, buffer.sampleRate, kbps);
  const block = 1152;
  const parts: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += block) {
    const chunk = encoder.encodeBuffer(left.subarray(i, i + block), channels > 1 ? right.subarray(i, i + block) : undefined);
    if (chunk.length) parts.push(Uint8Array.from(chunk));
  }
  const tail = encoder.flush();
  if (tail.length) parts.push(Uint8Array.from(tail));
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return new Blob([merged], { type: "audio/mpeg" });
}

export function downloadName(sourceName: string, format: ExportFormat): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "track";
  return `${base}-${format === "mp3" ? "edit" : "edit"}.${format}`;
}
