// Measures what the exported audio actually is: for each preset, load the test
// tone, apply the preset, render a WAV and read its samples in Node. The peak
// must stay under 0 dBFS and the length must match trim / speed + reverb tail.
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const BASE = (process.env.SHIPSITE_URL || "").replace(/\/$/, "");
let failed = 0;

function measure(name, ok, value, unit, detail) {
  console.log(`MEASURE ${JSON.stringify({ name, ok, value, unit, detail })}`);
  if (!ok) failed += 1;
}

function testWav(seconds = 2, rate = 44100) {
  const n = Math.floor(seconds * rate);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i += 1) {
    const t = i / rate;
    const v = 0.32 * Math.sin(2 * Math.PI * 220 * t) + 0.18 * Math.sin(2 * Math.PI * 440 * t);
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return { name: "measure-tone.wav", mimeType: "audio/wav", buffer: buf };
}

function readWav(bytes) {
  const rate = bytes.readUInt32LE(24);
  const channels = bytes.readUInt16LE(22);
  const bits = bytes.readUInt16LE(34);
  let offset = 12;
  while (offset < bytes.length - 8 && bytes.toString("ascii", offset, offset + 4) !== "data") {
    offset += 8 + bytes.readUInt32LE(offset + 4);
  }
  const length = bytes.readUInt32LE(offset + 4);
  const start = offset + 8;
  const frames = Math.floor(length / (channels * (bits / 8)));
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < frames; i += 1) {
    for (let c = 0; c < channels; c += 1) {
      const v = bytes.readInt16LE(start + (i * channels + c) * 2) / 32768;
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
    }
  }
  return { rate, channels, bits, frames, seconds: frames / rate, peak, rms: Math.sqrt(sum / (frames * channels)) };
}

const PRESETS = [
  { label: "Classic Slowed + Reverb", speed: 0.8 },
  { label: "Nightcore", speed: 1.25 },
  { label: "Daycore", speed: 0.75 },
];

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('[data-tool-input="audio-file"]').setInputFiles(testWav());
  await page.waitForSelector(".chip-row b", { timeout: 40000 });

  for (const preset of PRESETS) {
    await page.locator(".preset", { hasText: preset.label }).click();
    await page.locator(".format", { hasText: "WAV" }).click();
    await page.getByRole("button", { name: "Render", exact: true }).click();
    const link = page.locator("a.download", { hasText: "Download WAV" });
    await link.waitFor({ state: "visible", timeout: 150000 });
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 120000 }), link.click()]);
    const bytes = await readFile(await download.path());
    const wav = readWav(bytes);
    const peakDb = 20 * Math.log10(wav.peak || 1e-9);
    const expected = 2 / preset.speed + 1.6;
    measure(`${preset.label} peak`, peakDb < -0.1 && peakDb > -30, Number(peakDb.toFixed(2)), "dBFS", "bounds -30..-0.1");
    measure(`${preset.label} length`, Math.abs(wav.seconds - expected) < 0.35, Number(wav.seconds.toFixed(2)), "s", `expected ${expected.toFixed(2)} s (2 s / ${preset.speed} + 1.6 s tail)`);
    measure(`${preset.label} sample rate`, wav.rate === 44100 && wav.bits === 16, wav.rate, "Hz", `16-bit, ${wav.channels} ch`);
  }
} finally {
  await browser.close();
}

process.exit(failed === 0 ? 0 : 1);
