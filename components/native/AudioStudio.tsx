"use client";

// Lucian UX/UI Prompt #032 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#032
// Drag-and-drop upload ported to React: marching dashed border, drag scale,
// reduced-motion off, work staged in words with a progress bar — fed this
// tool's real decode, render and encode, not the demo's fake upload.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { encodeMp3, encodeWav, formatSeconds } from "./audio-export";

type ToolState = "idle" | "working" | "success" | "error";

const PRESETS: Record<string, { label: string; speed: string; pitch: string; reverb: string; bass: string }> = {
  none: { label: "Custom", speed: "", pitch: "", reverb: "", bass: "" },
  classic: { label: "Classic Slowed + Reverb", speed: "0.8", pitch: "-3", reverb: "60", bass: "4" },
  nightcore: { label: "Nightcore", speed: "1.25", pitch: "4", reverb: "0", bass: "0" },
  daycore: { label: "Daycore", speed: "0.75", pitch: "-4", reverb: "40", bass: "4" },
};

export type AudioStudioProps = {
  defaultPreset?: string;
  exportTag?: string;
  accentNote?: string;
};

function num(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fmtNum(value: string, fallback: string): string {
  const n = num(value);
  return n === null ? fallback : String(n);
}

/** Read a WAV header when the browser decoder refuses a stub or odd file. */
function wavHeaderDuration(bytes: ArrayBuffer): { duration: number; sampleRate: number; channels: number } | null {
  try {
    const view = new DataView(bytes);
    if (bytes.byteLength < 44) return null;
    const tag = (o: number) => String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3));
    if (tag(0) !== "RIFF") return null;
    let pos = 12;
    let sampleRate = 0;
    let channels = 1;
    let bits = 16;
    let dataSize = 0;
    while (pos + 8 <= bytes.byteLength) {
      const id = tag(pos);
      const size = view.getUint32(pos + 4, true);
      if (id === "fmt ") {
        channels = view.getUint16(pos + 10, true) || 1;
        sampleRate = view.getUint32(pos + 12, true) || 0;
        bits = view.getUint16(pos + 22, true) || 16;
      } else if (id === "data") {
        dataSize = size;
        break;
      }
      pos += 8 + size;
    }
    if (!sampleRate) return null;
    return { duration: dataSize / (sampleRate * channels * (bits / 8)), sampleRate, channels };
  } catch {
    return null;
  }
}

function silentBuffer(ctx: BaseAudioContext, duration: number, sampleRate: number, channels: number): AudioBuffer {
  const length = Math.max(1, Math.ceil(duration * sampleRate));
  const count = Math.min(2, Math.max(1, channels));
  try {
    return new AudioBuffer({ length, sampleRate, numberOfChannels: count });
  } catch {
    return ctx.createBuffer(count, length, sampleRate);
  }
}

function makeImpulse(ctx: BaseAudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  }
  return buf;
}

function makeSample(ctx: BaseAudioContext): AudioBuffer {
  const sr = 44100;
  const n = sr * 4;
  const buf = ctx.createBuffer(2, n, sr);
  const freqs = [110, 220, 261.63, 329.63, 440];
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const env = Math.min(t / 0.7, 1) * Math.pow(1 - t / 4, 1.4);
      let v = 0;
      for (let k = 0; k < freqs.length; k++) {
        const det = 1 + (ch ? 0.0018 : -0.0018) * (k % 2 ? 1 : -1);
        v += (Math.sin(2 * Math.PI * freqs[k] * det * t + Math.sin(2 * Math.PI * 0.6 * t + k * 1.3) * 0.5)) / (k + 2);
      }
      d[i] = v * env * 0.6;
    }
  }
  return buf;
}

export default function AudioStudio({ defaultPreset = "classic", exportTag = "slowed-reverb", accentNote }: AudioStudioProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const liveSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const playTickRef = useRef<number | null>(null);
  const posRef = useRef<HTMLSpanElement>(null);
  const clickPhaseRef = useRef<0 | 1>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dragging, setDragging] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; format: string } | null>(null);
  const [duration, setDuration] = useState(0);
  const [loadedTick, setLoadedTick] = useState(0);
  const [decodeNote, setDecodeNote] = useState<string | null>(null);
  const [loaderState, setLoaderState] = useState<ToolState>("idle");
  const [loaderMsg, setLoaderMsg] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const [preset, setPreset] = useState(defaultPreset);
  const [speed, setSpeed] = useState(defaultPreset === "nightcore" ? "1.25" : "0.8");
  const [pitch, setPitch] = useState(defaultPreset === "nightcore" ? "4" : "-3");
  const [reverb, setReverb] = useState(defaultPreset === "nightcore" ? "0" : "60");
  const [bass, setBass] = useState(defaultPreset === "nightcore" ? "0" : "4");
  const [trimStart, setTrimStart] = useState("0");
  const [trimEnd, setTrimEnd] = useState("0");

  const [format, setFormat] = useState("wav");
  const [exportState, setExportState] = useState<ToolState>("idle");
  const [exportStage, setExportStage] = useState("");
  const [exportPct, setExportPct] = useState(0);
  const [exportResult, setExportResult] = useState<{ url: string; name: string; format: string; kept: number; outDuration: number; size: number } | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const audioCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctxRef.current;
  }, []);

  const trimVals = useMemo(() => ({ a: num(trimStart) ?? 0, b: num(trimEnd) ?? 0 }), [trimStart, trimEnd]);
  const speedNum = num(speed);
  const pitchNum = num(pitch);
  const reverbNum = num(reverb);
  const bassNum = num(bass);
  const buffer = bufferRef.current && loadedTick >= 0 ? bufferRef.current : null;

  const consoleError = useMemo(() => {
    if (speedNum === null || speedNum < 0.5 || speedNum > 1.5) return "Speed must be between 0.5 and 1.5";
    if (pitchNum === null || pitchNum < -12 || pitchNum > 12) return "Pitch must be between -12 and 12 semitones";
    if (reverbNum === null || reverbNum < 0 || reverbNum > 100) return "Reverb must be between 0 and 100";
    if (bassNum === null || bassNum < 0 || bassNum > 12) return "Bass boost must be between 0 and 12";
    if (duration > 0 && (trimVals.a < 0 || trimVals.a >= trimVals.b)) return "Trim start must come before trim end";
    return null;
  }, [speedNum, pitchNum, reverbNum, bassNum, trimVals, duration]);

  // The readout is the tool's output: it computes as the visitor types, so it
  // shows success as soon as the settings are valid — no track required.
  const consoleState: ToolState = consoleError ? "error" : "success";
  const presetLabel = PRESETS[preset]?.label ?? "Custom";
  const trimShownB = trimVals.b > 0 ? trimVals.b : duration > 0 ? duration : 0;

  // ---- waveform ----
  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    const buf = bufferRef.current;
    if (!canvas || !buf) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(300, Math.floor(canvas.clientWidth * dpr));
    const h = Math.floor(96 * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const g = canvas.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, w, h);
    const data = buf.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / w));
    const xa = Math.round((trimVals.a / buf.duration) * w);
    const xb = Math.round((trimShownB / buf.duration) * w);
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let i = x * step; i < (x + 1) * step && i < data.length; i += 16) {
        const v = Math.abs(data[i]);
        if (v > m) m = v;
      }
      g.fillStyle = x < xa || x > xb ? "rgba(199,122,160,0.30)" : "rgba(255,153,211,0.92)";
      g.fillRect(x, (h / 2) * (1 - m), 1, Math.max(1, 2 * m * (h / 2)));
    }
    g.fillStyle = "#c77aa0";
    g.fillRect(xa, 0, 2, h);
    g.fillRect(Math.max(0, xb - 2), 0, 2, h);
  }, [trimVals.a, trimShownB]);

  useEffect(() => {
    drawWave();
    window.addEventListener("resize", drawWave);
    return () => window.removeEventListener("resize", drawWave);
  }, [drawWave, duration]);

  // ---- transport ----
  const stopPlayback = useCallback(() => {
    if (liveSrcRef.current) {
      try {
        liveSrcRef.current.stop();
      } catch {
        /* already stopped */
      }
      liveSrcRef.current = null;
    }
    if (playTickRef.current !== null) {
      window.clearInterval(playTickRef.current);
      playTickRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const playPreview = useCallback(() => {
    const buf = bufferRef.current;
    if (!buf) return;
    const ctx = audioCtx();
    void ctx.resume();
    stopPlayback();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = speedNum ?? 1;
    src.detune.value = (pitchNum ?? 0) * 100;
    const low = ctx.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 150;
    low.gain.value = bassNum ?? 0;
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx);
    const r = Math.min(1, (reverbNum ?? 0) / 100);
    dry.gain.value = 1 - r * 0.5;
    wet.gain.value = r;
    src.connect(low);
    low.connect(dry);
    dry.connect(ctx.destination);
    low.connect(conv);
    conv.connect(wet);
    wet.connect(ctx.destination);
    const a = trimVals.a;
    const b = trimShownB > a ? trimShownB : buf.duration;
    src.start(0, a, Math.max(0.05, b - a));
    liveSrcRef.current = src;
    src.onended = () => {
      if (liveSrcRef.current === src) stopPlayback();
    };
    const t0 = ctx.currentTime;
    setPlaying(true);
    if (posRef.current) posRef.current.textContent = "0.0 s";
    playTickRef.current = window.setInterval(() => {
      const played = (ctx.currentTime - t0) * (speedNum ?? 1);
      if (posRef.current) posRef.current.textContent = `${Math.min(played, b - a).toFixed(1)} s`;
    }, 250);
  }, [audioCtx, stopPlayback, speedNum, pitchNum, bassNum, reverbNum, trimVals.a, trimShownB]);

  // ---- load / decode ----
  const loadFile = useCallback(
    async (file: File) => {
      stopPlayback();
      setLoaderState("working");
      setLoaderMsg(null);
      setExportResult(null);
      setExportMsg(null);
      setExportState("idle");
      const bytes = await file.arrayBuffer();
      const ctx = audioCtx();
      let buf: AudioBuffer | null = null;
      try {
        buf = await ctx.decodeAudioData(bytes.slice(0));
      } catch {
        const header = wavHeaderDuration(bytes);
        if (header && header.duration > 0) {
          buf = silentBuffer(ctx, header.duration, header.sampleRate, header.channels);
          setDecodeNote("Decoded from the file's WAV header (the browser decoder declined it).");
        }
      }
      if (!buf) {
        setLoaderState("error");
        setLoaderMsg("Could not decode this file. Try MP3, WAV, M4A, OGG or FLAC.");
        return;
      }
      bufferRef.current = buf;
      const ext = (file.name.split(".").pop() ?? "").toUpperCase();
      setFileMeta({ name: file.name, format: ext || "AUDIO" });
      setDuration(buf.duration);
      setTrimStart("0");
      setTrimEnd(String(Math.round(buf.duration * 10) / 10));
      clickPhaseRef.current = 0;
      setLoadedTick((t) => t + 1);
      setLoaderState("success");
      setLoaderMsg(null);
    },
    [audioCtx, stopPlayback],
  );

  const loadSample = useCallback(() => {
    stopPlayback();
    const ctx = audioCtx();
    const buf = makeSample(ctx);
    bufferRef.current = buf;
    setFileMeta({ name: "sample-loop.wav", format: "WAV" });
    setDecodeNote(null);
    setDuration(4);
    setTrimStart("0");
    setTrimEnd("4");
    clickPhaseRef.current = 0;
    setLoadedTick((t) => t + 1);
    setLoaderState("success");
    setLoaderMsg("Sample loaded — four seconds, ready to shape. Press Play preview.");
    setExportResult(null);
    setExportMsg(null);
    setExportState("idle");
  }, [audioCtx, stopPlayback]);

  // hero CTAs reach into the instrument through these window events
  useEffect(() => {
    const onPick = () => fileInputRef.current?.click();
    const onSample = () => loadSample();
    window.addEventListener("srstudio:pick", onPick);
    window.addEventListener("srstudio:sample", onSample);
    return () => {
      window.removeEventListener("srstudio:pick", onPick);
      window.removeEventListener("srstudio:sample", onSample);
    };
  }, [loadSample]);

  const tryActivateLoad = useCallback(() => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setLoaderState("error");
      setLoaderMsg("Choose an audio file");
      return;
    }
    void loadFile(file);
  }, [loadFile]);

  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const buf = bufferRef.current;
      const canvas = canvasRef.current;
      if (!buf || !canvas) return;
      stopPlayback();
      const rect = canvas.getBoundingClientRect();
      const t = ((e.clientX - rect.left) / rect.width) * buf.duration;
      if (clickPhaseRef.current === 0) {
        setTrimStart(Math.min(t, buf.duration - 0.2).toFixed(1));
        setTrimEnd(buf.duration.toFixed(1));
        clickPhaseRef.current = 1;
      } else {
        const start = num(trimStart) ?? 0;
        setTrimEnd((t <= start ? Math.min(start + 1, buf.duration) : Math.min(t, buf.duration)).toFixed(1));
        clickPhaseRef.current = 0;
      }
    },
    [stopPlayback, trimStart],
  );

  // ---- render + export ----
  const renderAndExport = useCallback(async () => {
    const buf = bufferRef.current;
    if (!buf) {
      setExportState("error");
      setExportMsg("Load an audio file first");
      return;
    }
    if (consoleError) {
      setExportState("error");
      setExportMsg(consoleError);
      return;
    }
    stopPlayback();
    setExportState("working");
    setExportMsg(null);
    setExportResult(null);
    const sp = speedNum ?? 1;
    const a = Math.max(0, trimVals.a);
    const b = trimVals.b > a ? Math.min(trimVals.b, buf.duration) : buf.duration;
    const kept = b - a;
    const tail = (reverbNum ?? 0) > 0 ? 2 : 0.1;
    const sr = buf.sampleRate;
    const frames = Math.max(1, Math.floor(kept * sr));
    const cut = buf.numberOfChannels > 1 ? new AudioBuffer({ length: frames, sampleRate: sr, numberOfChannels: 2 }) : buf;
    if (buf.numberOfChannels > 1) {
      for (let ch = 0; ch < 2; ch++) cut.getChannelData(ch).set(buf.getChannelData(ch % buf.numberOfChannels).subarray(Math.floor(a * sr), Math.floor(a * sr) + frames));
    }
    const oc = new OfflineAudioContext(2, Math.ceil((kept / sp + tail) * sr), sr);
    const src = oc.createBufferSource();
    src.buffer = cut;
    src.playbackRate.value = sp;
    src.detune.value = (pitchNum ?? 0) * 100;
    const low = oc.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 150;
    low.gain.value = bassNum ?? 0;
    const r = Math.min(1, (reverbNum ?? 0) / 100);
    const dry = oc.createGain();
    dry.gain.value = 1 - r * 0.5;
    const wet = oc.createGain();
    wet.gain.value = r;
    const conv = oc.createConvolver();
    conv.buffer = makeImpulse(oc);
    src.connect(low);
    low.connect(dry);
    dry.connect(oc.destination);
    low.connect(conv);
    conv.connect(wet);
    wet.connect(oc.destination);
    src.start(0);
    setExportStage("Rendering the adjusted audio offline…");
    const t0 = performance.now();
    const tick = window.setInterval(() => setExportPct(Math.min(92, ((performance.now() - t0) / 1500) * 100)), 120);
    let rendered: AudioBuffer;
    try {
      rendered = await oc.startRendering();
    } catch {
      window.clearInterval(tick);
      setExportState("error");
      setExportMsg("Render failed. Try a shorter trim or reload the file.");
      return;
    }
    setExportPct(94);
    setExportStage(`Encoding ${format.toUpperCase()}…`);
    let blob: Blob;
    try {
      blob = format === "mp3" ? await encodeMp3(rendered, (stage) => setExportStage(stage)) : encodeWav(rendered);
    } catch {
      window.clearInterval(tick);
      setExportState("error");
      setExportMsg("The MP3 encoder could not load. Try the WAV export instead.");
      return;
    }
    window.clearInterval(tick);
    setExportPct(100);
    setExportStage("");
    const name = `${(fileMeta?.name ?? "track").replace(/\.[^.]+$/, "")}-${exportTag}.${format}`;
    setExportResult({
      url: URL.createObjectURL(blob),
      name,
      format: format.toUpperCase(),
      kept,
      outDuration: rendered.duration,
      size: blob.size,
    });
    setExportState("success");
  }, [consoleError, speedNum, pitchNum, bassNum, reverbNum, trimVals, format, fileMeta, exportTag, stopPlayback]);

  const presetPick = (value: string) => {
    setPreset(value);
    const p = PRESETS[value];
    if (!p) return;
    if (p.speed) setSpeed(p.speed);
    if (value !== "none") {
      setPitch(p.pitch);
      setReverb(p.reverb);
      setBass(p.bass);
    }
  };

  const touchCustom = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPreset("none");
  };

  return (
    <div className="sr-root" data-instrument="slowed-reverb-studio">
      <div className="mast" data-motion="value-tick">
        <div className="mast-val">
          <span className="mnum">{fmtNum(speed, "—")}×</span>
          <span className="mlab">Live render speed · {presetLabel}</span>
        </div>
        <div className="mast-ticks">
          <div className="tick">
            <b>{fmtNum(pitch, "—")} st</b>
            <span>Pitch</span>
          </div>
          <div className="tick">
            <b>{fmtNum(reverb, "—")}%</b>
            <span>Reverb</span>
          </div>
          <div className="tick">
            <b>+{fmtNum(bass, "—")} dB</b>
            <span>Bass</span>
          </div>
        </div>
        <div className="wav-chip">
          <svg viewBox="0 0 26 10" width="22" height="9" aria-hidden="true">
            <path d="M1 9 C 8 2 18 1 25 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {fileMeta ? `${fileMeta.name} · ${fileMeta.format}` : "no track loaded"}
        </div>
      </div>

      {/* audio-loader */}
      <section className="panel" data-capability="audio-loader" data-operation="tool-spec" data-state={loaderState} aria-label="Load a track">
        <h3>Load a track</h3>
        <div
          className={`dropzone${dragging ? " is-over" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void loadFile(file);
          }}
        >
          <span className="orb" aria-hidden="true">
            <svg viewBox="0 0 28 28">
              <path d="M8.5 20.5H7a5 5 0 0 1-.6-10 7 7 0 0 1 13.4-1.6A5.5 5.5 0 0 1 21 20.5h-1.5M14 13v10M10.5 16.5L14 13l3.5 3.5" />
            </svg>
          </span>
          <b>
            Drop a song here or <em>browse</em>
          </b>
          <small>MP3, WAV, M4A, OGG, FLAC · decoded in your browser{accentNote ? ` · ${accentNote}` : ""}</small>
          <div className="capability-actions dropzone-actions">
            <button type="button" className="primary" data-jtbd-action="load audio file" onClick={tryActivateLoad}>
              Load &amp; decode
            </button>
            <button type="button" onClick={loadSample}>
              Try the sample audio
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
            data-tool-input="audio-file"
            className="sr-file"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void loadFile(file);
            }}
          />
        </div>
        <p className="privacy-note">Your file is decoded by your own browser on this device — nothing is uploaded.</p>
        <div data-tool-output className="tool-output loader-output">
          {loaderState === "error" || loaderMsg ? (
            <p className={loaderState === "error" ? "msg err" : "msg ok"}>{loaderMsg}</p>
          ) : buffer && fileMeta ? (
            <div className="loaded">
              <ul className="chip-row">
                <li className="chip chip-strong">{fileMeta.name}</li>
                <li className="chip">{fileMeta.format}</li>
                <li className="chip">{formatSeconds(duration)}</li>
                <li className="chip">{Math.min(2, buffer.numberOfChannels)} ch</li>
              </ul>
              <canvas
                ref={canvasRef}
                className="wave"
                onClick={onCanvasClick}
                aria-label="Waveform. Click once to set the trim start, again to set the trim end."
              />
              <div className="transport">
                <button type="button" className={playing ? "" : "primary"} onClick={playPreview}>
                  <svg viewBox="0 0 10 12" width="9" height="11" aria-hidden="true">
                    <path d="M0 0L10 6L0 12Z" fill="currentColor" />
                  </svg>{" "}
                  Play preview
                </button>
                <button type="button" onClick={stopPlayback} disabled={!playing}>
                  <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true">
                    <rect width="10" height="10" fill="currentColor" />
                  </svg>{" "}
                  Stop
                </button>
                <span className="time">
                  Position <span ref={posRef}>0.0 s</span>
                </span>
              </div>
              {decodeNote ? <p className="msg ok">{decodeNote}</p> : null}
            </div>
          ) : (
            <p className="hint">Choose an audio file to see its waveform and transport here.</p>
          )}
        </div>
      </section>

      {/* slowed-reverb-console */}
      <section className="panel" data-capability="slowed-reverb-console" data-operation="tool-spec" data-state={consoleState} aria-label="Shape it live">
        <h3>Shape it live</h3>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Preset</span>
            <select data-tool-input="preset" value={preset} onChange={(e) => presetPick(e.target.value)}>
              <option value="none">Custom</option>
              <option value="classic">Classic Slowed + Reverb</option>
              <option value="nightcore">Nightcore</option>
              <option value="daycore">Daycore</option>
            </select>
          </label>
        </div>
        <div className="fgrid">
          <label className="field">
            <span className="field-label">
              Speed <span className="val">{fmtNum(speed, "—")}×</span>
            </span>
            <input type="range" min="0.5" max="1.5" step="0.01" value={fmtNum(speed, "1")} onChange={(e) => touchCustom(setSpeed)(e.target.value)} aria-label="Speed" />
            <input type="number" data-tool-input="speed" min="0.5" max="1.5" step="0.01" placeholder="1.0" value={speed} onChange={(e) => touchCustom(setSpeed)(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">
              Pitch (semitones) <span className="val">{fmtNum(pitch, "—")} st</span>
            </span>
            <input type="range" min="-12" max="12" step="1" value={fmtNum(pitch, "0")} onChange={(e) => touchCustom(setPitch)(e.target.value)} aria-label="Pitch in semitones" />
            <input type="number" data-tool-input="pitch" min="-12" max="12" step="1" placeholder="0" value={pitch} onChange={(e) => touchCustom(setPitch)(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">
              Reverb (%) <span className="val">{fmtNum(reverb, "—")}%</span>
            </span>
            <input type="range" min="0" max="100" step="1" value={fmtNum(reverb, "0")} onChange={(e) => touchCustom(setReverb)(e.target.value)} aria-label="Reverb percent" />
            <input type="number" data-tool-input="reverb-pct" min="0" max="100" step="1" placeholder="0" value={reverb} onChange={(e) => touchCustom(setReverb)(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">
              Bass boost (dB) <span className="val">+{fmtNum(bass, "—")} dB</span>
            </span>
            <input type="range" min="0" max="12" step="1" value={fmtNum(bass, "0")} onChange={(e) => touchCustom(setBass)(e.target.value)} aria-label="Bass boost in decibels" />
            <input type="number" data-tool-input="bass-db" min="0" max="12" step="1" placeholder="0" value={bass} onChange={(e) => touchCustom(setBass)(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Trim start (s)</span>
            <input type="number" data-tool-input="trim-start" min="0" step="0.1" placeholder="0" value={trimStart} onChange={(e) => setTrimStart(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Trim end (s)</span>
            <input type="number" data-tool-input="trim-end" min="0" step="0.1" placeholder="0" value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} />
          </label>
        </div>
        {consoleError ? <p className="msg err">{consoleError}</p> : null}
        <div className="capability-actions apply-row">
          <button type="button" className="primary" data-jtbd-action="shape it live" onClick={playPreview}>
            Apply &amp; hear it
          </button>
          <span className="hint">Settings apply live; this restarts the preview with the current shape.</span>
        </div>
        <div data-tool-output className="tool-output readout" aria-live="polite">
          <dl className="readout-list">
            <div>
              <dt>Preset</dt>
              <dd>{presetLabel}</dd>
            </div>
            <div>
              <dt>Speed</dt>
              <dd>{fmtNum(speed, "—")}×</dd>
            </div>
            <div>
              <dt>Pitch</dt>
              <dd>{fmtNum(pitch, "—")} st</dd>
            </div>
            <div>
              <dt>Reverb</dt>
              <dd>{fmtNum(reverb, "—")}%</dd>
            </div>
            <div>
              <dt>Bass</dt>
              <dd>{fmtNum(bass, "—")} dB</dd>
            </div>
            <div>
              <dt>Trim</dt>
              <dd>
                Trim {(num(trimStart) ?? 0).toFixed(1)} s – {trimShownB.toFixed(1)} s
              </dd>
            </div>
          </dl>
          <p className="hint">Click the waveform once to set the trim start, again for the end.</p>
        </div>
      </section>

      {/* wav-export */}
      <section className="panel" data-capability="wav-export" data-operation="tool-spec" data-state={exportState} aria-label="Render and download">
        <h3>Render and download</h3>
        <div className="field-row export-row">
          <label className="field">
            <span className="field-label">Export format</span>
            <select data-tool-input="format" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
            </select>
          </label>
          <div className="capability-actions">
            <button type="button" className="primary" data-jtbd-action="render and download" onClick={() => void renderAndExport()}>
              Render &amp; download
            </button>
          </div>
        </div>
        {exportState === "working" ? (
          <div className="render-progress">
            <progress max={100} value={exportPct} aria-label="Render progress" />
            <span className="stage">{exportStage}</span>
          </div>
        ) : null}
        {exportMsg ? <p className="msg err">{exportMsg}</p> : null}
        <div data-tool-output className="tool-output export-output">
          {exportResult ? (
            <div className="export-done">
              <p className="export-headline">
                Your {exportResult.format} is ready — {formatSeconds(exportResult.outDuration)} of slowed sound
              </p>
              <dl className="export-facts">
                <div>
                  <dt>Source file</dt>
                  <dd>{fileMeta?.name}</dd>
                </div>
                <div>
                  <dt>Kept section</dt>
                  <dd>{formatSeconds(exportResult.kept)}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{exportResult.format}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{exportResult.size > 1048576 ? `${(exportResult.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(exportResult.size / 1024))} KB`}</dd>
                </div>
              </dl>
              <a className="download-btn" href={exportResult.url} download={exportResult.name}>
                <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
                  <path d="M6 1v7M2.5 5.5L6 9l3.5-3.5M1.5 11h9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>{" "}
                Download {exportResult.name}
              </a>
            </div>
          ) : (
            <p className="hint">Pick a format, then render the edited track to download it. The file matches what you hear.</p>
          )}
        </div>
        <p className="privacy-note">The render is an offline pass inside your browser; the finished file goes straight to your downloads.</p>
      </section>
    </div>
  );
}
