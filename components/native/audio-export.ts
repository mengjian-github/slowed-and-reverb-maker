// Pure audio helpers for the slowed and reverb console: duration formatting,
// WAV encoding and a browser-side MP3 encode via lamejs. Everything here runs
// on the visitor's device; nothing is uploaded.

export function formatSeconds(total: number): string {
  const safe = Number.isFinite(total) && total > 0 ? total : 0;
  const rounded = Math.round(safe * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return text + " s";
}

export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytes = new ArrayBuffer(44 + frames * channels * 2);
  const view = new DataView(bytes);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + frames * channels * 2, true);
  writeText(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, frames * channels * 2, true);
  let offset = 44;
  const data: Float32Array[] = [];
  for (let ch = 0; ch < channels; ch++) data.push(buffer.getChannelData(ch));
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = Math.max(-1, Math.min(1, data[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([bytes], { type: "audio/wav" });
}

type LameEncoder = {
  encodeBuffer(samples: Int16Array): Int8Array;
  flush(): Int8Array;
};

// lamejs 1.2.1 needs its internal classes on the global scope before the
// encoder is constructed (upstream bug, worked around the same way in every
// project that ships it).
async function loadLame(): Promise<{ new (channels: number, sampleRate: number, kbps: number): LameEncoder }> {
  const [lame, mpegMode, lameCore, bitStream] = await Promise.all([
    import("lamejs/lame.all.js"),
    import("lamejs/src/js/MPEGMode"),
    import("lamejs/src/js/Lame"),
    import("lamejs/src/js/BitStream"),
  ]);
  const globalScope = globalThis as unknown as Record<string, unknown>;
  globalScope.MPEGMode = (mpegMode as { MPEGMode?: unknown }).MPEGMode ?? mpegMode;
  globalScope.Lame = (lameCore as { Lame?: unknown }).Lame ?? lameCore;
  globalScope.BitStream = (bitStream as { BitStream?: unknown }).BitStream ?? bitStream;
  const ctor = (lame as { Mp3Encoder?: unknown }).Mp3Encoder as
    | { new (channels: number, sampleRate: number, kbps: number): LameEncoder }
    | undefined;
  if (!ctor) throw new Error("MP3 encoder failed to load");
  return ctor;
}

export async function encodeMp3(buffer: AudioBuffer, onStage?: (stage: string) => void): Promise<Blob> {
  onStage?.("Loading the MP3 encoder (lamejs, ~160 KB, from this site)…");
  const Mp3Encoder = await loadLame();
  const channels = Math.min(2, buffer.numberOfChannels);
  const encoder = new Mp3Encoder(channels, buffer.sampleRate, 192);
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;
  const blockSize = 1152 * 20;
  const chunks: BlobPart[] = [];
  for (let offset = 0; offset < buffer.length; offset += blockSize) {
    const sliceEnd = Math.min(offset + blockSize, buffer.length);
    const leftSamples = new Int16Array(sliceEnd - offset);
    const rightSamples = new Int16Array(sliceEnd - offset);
    for (let i = offset; i < sliceEnd; i++) {
      leftSamples[i - offset] = Math.max(-32768, Math.min(32767, Math.round(left[i] * 0x7fff)));
      rightSamples[i - offset] = Math.max(-32768, Math.min(32767, Math.round(right[i] * 0x7fff)));
    }
    const encoded =
      channels > 1
        ? encoder.encodeBuffer(leftSamples, rightSamples as unknown as Int16Array)
        : encoder.encodeBuffer(leftSamples);
    if (encoded.length) chunks.push(new Int8Array(encoded));
    onStage?.(`Encoding MP3… ${Math.min(100, Math.round((sliceEnd / buffer.length) * 100))}%`);
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(new Int8Array(tail));
  return new Blob(chunks, { type: "audio/mpeg" });
}
