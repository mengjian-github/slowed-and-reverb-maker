// Functional gate for Slowed and Reverb Maker: drives every control a visitor
// can use on the two tool pages against the deployed site, checks the visible
// result of each, opens every download and checks its bytes, and measures
// overflow on every route at phone width.
import { chromium, webkit } from "playwright";
import { readFile } from "node:fs/promises";

const BASE = (process.env.SHIPSITE_URL || "").replace(/\/$/, "");
const BROWSER = process.env.SHIPSITE_BROWSER === "webkit" ? webkit : chromium;

const ROUTES = [
  "/",
  "/nightcore-maker/",
  "/how-to-make-slowed-and-reverb/",
  "/slowed-vs-nightcore/",
  "/about/",
  "/privacy/",
  "/terms/",
];

const out = { controls: [], downloads: [], share: undefined, overflow: [], consoleErrors: [], failedRequests: [] };
let failed = 0;

function rec(name, ok, detail) {
  out.controls.push({ name, ok, detail: String(detail).replace(/\s+/g, " ").slice(0, 150) });
  if (!ok) failed += 1;
}

/** A 2 s, 44.1 kHz mono 16-bit WAV test tone (220 Hz + 440 Hz). */
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
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 44 + i * 2);
  }
  return { name: "verify-tone.wav", mimeType: "audio/wav", buffer: buf };
}

const FILE = testWav();

function watch(page) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/\[Report Only\]|report-only mode|Content-Security-Policy/i.test(text)) return;
    out.consoleErrors.push(text.slice(0, 200));
  });
  page.on("response", (res) => {
    if (res.status() < 400) return;
    if (BASE && !res.url().startsWith(BASE)) return;
    out.failedRequests.push(`${res.status()} ${res.url().slice(BASE.length)}`);
  });
  page.on("requestfailed", (req) => {
    if (BASE && !req.url().startsWith(BASE)) return;
    // A navigation cancels in-flight image and manifest loads; the browser
    // reports those as failures even though the request was never needed.
    const why = req.failure()?.errorText ?? "";
    if (/cancelled|ERR_ABORTED|NS_BINDING_ABORTED/i.test(why)) return;
    out.failedRequests.push(`failed ${req.url().slice(BASE.length)} ${why}`.slice(0, 200));
  });
}

async function downloadOf(page, link) {
  // The download event occasionally arrives late when two browsers run side by
  // side on a loaded machine, so wait for it on its own and retry the click.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const waiting = page.waitForEvent("download", { timeout: 60000 }).catch(() => null);
    await link.click({ timeout: 20000 }).catch(() => {});
    const download = await waiting;
    if (download) {
      const bytes = await readFile(await download.path());
      return { name: download.suggestedFilename(), bytes };
    }
    await page.waitForTimeout(700);
  }
  throw new Error(`no download event for ${(await link.innerText().catch(() => "download link")).slice(0, 40)}`);
}

function headerOf(bytes) {
  if (bytes.subarray(0, 4).toString() === "RIFF") return "RIFF/WAVE";
  if (bytes.subarray(0, 3).toString() === "ID3") return "ID3/MP3";
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "MPEG/MP3";
  return `unknown:${bytes.subarray(0, 4).toString("hex")}`;
}

async function loadFile(page) {
  // A file set before React hydrates is dropped when the client takes over, so
  // try again; the chip under the drop zone is the visible proof it landed.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.locator('[data-tool-input="audio-file"]').setInputFiles(FILE);
    try {
      await page.waitForFunction(() => /verify-tone/.test(document.querySelector(".chip-row b")?.textContent || ""), null, { timeout: 20000 });
      return true;
    } catch {
      await page.waitForTimeout(700);
    }
  }
  return false;
}

async function openTool(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-tool-input="audio-file"]', { state: "attached", timeout: 45000 });
  // Next.js hydrates after the HTML arrives; a click before the bundle runs is
  // a no-op, so let the page settle (deployed Workers are slower than a local
  // server) and give up waiting rather than fail if a request trickles.
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function loadSample(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole("button", { name: /Try the sample/i }).first().click();
    try {
      await page.waitForSelector(".chip-row b", { timeout: 12000 });
      return true;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  return false;
}

async function driveTool(page, label, opts = {}) {
  await openTool(page, `${BASE}${opts.path || "/"}`);

  // preset preloaded state
  if (opts.expectPreset) {
    const readout = await page.locator(".readout-line").innerText();
    rec(`${label} preset preloaded`, readout.includes(opts.expectPreset), readout.slice(0, 90));
  }

  // 1. sample audio
  const sampleOk = await loadSample(page);
  const sampleChip = sampleOk ? await page.locator(".chip-row").first().innerText() : "no chip appeared";
  rec(`${label} sample loads`, sampleOk && /\.wav/.test(sampleChip) && /4 s/.test(sampleChip), sampleChip);

  // 2. real file load
  const loaded = await loadFile(page);
  const fileChip = await page.locator(".chip-row").first().innerText();
  rec(`${label} file loads`, loaded && /verify-tone\.wav/.test(fileChip) && /2 s/.test(fileChip), fileChip);

  // 3. preset applies its numbers
  if (label === "slowed") {
    await page.locator(".preset", { hasText: "Classic Slowed + Reverb" }).click();
    const readout = await page.locator(".readout-line").innerText();
    const ok = /Classic Slowed \+ Reverb/.test(readout) && /Speed 0\.8×/.test(readout) && /Pitch -2 st/.test(readout) && /Reverb 55%/.test(readout);
    rec("classic preset", ok, readout);
  } else {
    await page.locator(".preset", { hasText: "Nightcore" }).first().click();
    const readout = await page.locator(".readout-line").innerText();
    const ok = /Nightcore/.test(readout) && /Speed 1\.25×/.test(readout) && /Pitch 4 st/.test(readout);
    rec("nightcore preset", ok, readout);
  }

  // 4. slider + number field drive the readout
  const speed = page.locator('[data-tool-input="speed"]');
  await speed.fill("0.75");
  await speed.dispatchEvent("input");
  await page.waitForTimeout(150);
  // The number box beside each range is the one visible value (the plain
  // readout is sr-only), so read it back from the field itself.
  const value = await speed.inputValue();
  const readout = await page.locator(".readout-line").innerText();
  rec(`${label} speed slider`, /0\.75/.test(value) && /Speed 0\.75×/.test(readout), `${value} | ${readout.slice(0, 60)}`);

  // 5. out-of-range value is a real error state
  await speed.fill("2");
  await speed.dispatchEvent("input");
  await page.locator(".deck-shape .primary, .capability-actions .primary").first().click();
  await page.waitForSelector(".deck-shape .output-error, .output-error", { timeout: 10000 });
  const err = await page.locator(".output-error").first().innerText();
  rec(`${label} range error`, /between 0\.5 and 1\.5/.test(err), err);
  await speed.fill("0.8");
  await speed.dispatchEvent("input");
  await page.waitForTimeout(120);

  // 6. transport: Play must actually start, which shows as Stop enabling.
  // WebKit starts its audio context asynchronously, so poll instead of
  // assuming it is running after a fixed pause.
  await page.getByRole("button", { name: "Play preview" }).click();
  const stop = page.getByRole("button", { name: "Stop" });
  let stopEnabled = false;
  for (let tick = 0; tick < 30 && !stopEnabled; tick += 1) {
    await page.waitForTimeout(250);
    stopEnabled = await stop.isEnabled().catch(() => false);
  }
  rec(`${label} preview plays`, stopEnabled, `stop enabled: ${stopEnabled}`);
  if (stopEnabled) await stop.click({ timeout: 10000 }).catch(() => {});

  // 7. trim bounds reach the readout
  await page.locator('[data-tool-input="trim-end"]').fill("1");
  await page.waitForTimeout(150);
  const trimReadout = await page.locator(".readout-line").innerText();
  rec(`${label} trim`, /Trim 0\.0–1\.0 s/.test(trimReadout), trimReadout.slice(0, 90));

  // 8. WAV export
  await page.locator(".format", { hasText: "WAV" }).click();
  await page.getByRole("button", { name: "Render", exact: true }).click();
  const wavLink = page.locator("a.download", { hasText: "Download WAV" });
  await wavLink.waitFor({ state: "visible", timeout: 150000 });
  const wav = await downloadOf(page, wavLink);
  const wavType = headerOf(wav.bytes);
  out.downloads.push({ name: "wav", ok: wavType === "RIFF/WAVE" && wav.bytes.length > 1000, type: wavType, bytes: wav.bytes.length });
  if (wavType !== "RIFF/WAVE" || wav.bytes.length < 1000) failed += 1;

  // 9. MP3 export
  await page.locator(".format", { hasText: "MP3" }).click();
  await page.getByRole("button", { name: "Render", exact: true }).click();
  const mp3Link = page.locator("a.download", { hasText: "Download MP3" });
  await mp3Link.waitFor({ state: "visible", timeout: 180000 });
  const mp3 = await downloadOf(page, mp3Link);
  const mp3Type = headerOf(mp3.bytes);
  out.downloads.push({ name: "mp3", ok: mp3Type.includes("MP3") && mp3.bytes.length > 1000, type: mp3Type, bytes: mp3.bytes.length });
  if (!mp3Type.includes("MP3") || mp3.bytes.length < 1000) failed += 1;
}

async function measureOverflow(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(250);
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  if (width.scroll > width.inner + 1) out.overflow.push({ route, scrollWidth: width.scroll, viewport: width.inner });
}

const browser = await BROWSER.launch();
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await desktop.newPage();
  watch(page);

  await driveTool(page, "slowed", { path: "/" });
  await driveTool(page, "nightcore", { path: "/nightcore-maker/", expectPreset: "Nightcore" });

  // every route's headline renders and the page has its own title
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const h1 = (await page.locator("h1").first().innerText().catch(() => "")).trim();
    rec(`route ${route}`, h1.length > 2, `h1: ${h1.slice(0, 60)}`);
  }
  await desktop.close();

  // phone: same core flow, touch input, and no sideways scroll anywhere
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, acceptDownloads: true });
  const mp = await phone.newPage();
  watch(mp);
  await openTool(mp, `${BASE}/`);
  const phoneLoaded = await loadFile(mp);
  rec("phone file load", phoneLoaded, phoneLoaded ? "verify-tone.wav loaded at 390" : "the file never reached the loader at 390");
  await mp.locator(".preset", { hasText: "Classic Slowed + Reverb" }).click();
  const phoneReadout = await mp.locator(".readout-line").innerText();
  rec("phone preset", /Classic Slowed \+ Reverb/.test(phoneReadout), phoneReadout.slice(0, 80));
  for (const route of ROUTES) await measureOverflow(mp, route);
  await phone.close();
} finally {
  await browser.close();
}

out.consoleErrors = [...new Set(out.consoleErrors)].slice(0, 10);
out.failedRequests = [...new Set(out.failedRequests)].slice(0, 10);
if (out.consoleErrors.length) failed += out.consoleErrors.length;
if (out.failedRequests.length) failed += out.failedRequests.length;
if (out.overflow.length) failed += out.overflow.length;
if (out.downloads.some((d) => !d.ok)) failed += 1;

console.log(`VERIFY_LIVE ${JSON.stringify(out)}`);
process.exit(failed === 0 ? 0 : 1);
