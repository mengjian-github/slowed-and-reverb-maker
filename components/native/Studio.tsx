"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ACCEPTED_EXT,
  PRESETS,
  PRESET_LABEL,
  SPEED_MAX,
  SPEED_MIN,
  PITCH_MAX,
  PITCH_MIN,
  REVERB_MAX,
  BASS_MAX,
  applyLive,
  bassError,
  decodeFile,
  downloadName,
  encodeMp3,
  encodeWav,
  formatSeconds,
  isAcceptedFile,
  makeSampleBuffer,
  parseNumber,
  peaksFromBuffer,
  pitchError,
  renderOffline,
  reverbError,
  speedError,
  wireGraph,
  type ExportFormat,
  type GraphNodes,
  type LoadedTrack,
  type PresetId,
  type ShapeSettings,
} from "@/lib/audio-engine";

type ToolState = "idle" | "working" | "success" | "error";

interface StudioProps {
  /** Nightcore page opens on the Nightcore preset; home opens on Custom. */
  defaultPreset?: PresetId;
  idPrefix: string;
}

const PRESET_OPTIONS: { value: PresetId; label: string }[] = [
  { value: "none", label: "Custom" },
  { value: "classic", label: "Classic Slowed + Reverb" },
  { value: "nightcore", label: "Nightcore" },
  { value: "daycore", label: "Daycore" },
];

function settingsFrom(preset: PresetId, speed: string, pitch: string, reverb: string, bass: string, trimStart: string, trimEnd: string, duration: number): ShapeSettings {
  const speedValue = parseNumber(speed) ?? 1;
  const pitchValue = parseNumber(pitch) ?? 0;
  const reverbValue = parseNumber(reverb) ?? 0;
  const bassValue = parseNumber(bass) ?? 0;
  const start = Math.max(0, parseNumber(trimStart) ?? 0);
  const endRaw = parseNumber(trimEnd) ?? 0;
  const end = endRaw > start ? Math.min(endRaw, duration || endRaw) : duration || endRaw;
  return {
    preset,
    speed: speedValue,
    pitch: pitchValue,
    reverbPct: reverbValue,
    bassDb: bassValue,
    trimStart: start,
    trimEnd: end,
  };
}

export function Studio({ defaultPreset = "classic", idPrefix }: StudioProps) {
  const initial = defaultPreset === "none" ? null : PRESETS[defaultPreset];
  const reactId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<GraphNodes | null>(null);
  const startedAt = useRef(0);

  const [track, setTrack] = useState<LoadedTrack | null>(null);
  const [loadState, setLoadState] = useState<ToolState>("idle");
  const [loadMessage, setLoadMessage] = useState("");
  const [decoding, setDecoding] = useState(false);

  const [preset, setPreset] = useState<PresetId>(defaultPreset);
  const [speed, setSpeed] = useState(initial ? String(initial.speed) : "1");
  const [pitch, setPitch] = useState(initial ? String(initial.pitch) : "0");
  const [reverb, setReverb] = useState(initial ? String(initial.reverbPct) : "0");
  const [bass, setBass] = useState(initial ? String(initial.bassDb) : "0");
  const [trimStart, setTrimStart] = useState("0");
  const [trimEnd, setTrimEnd] = useState("0");
  const [shapeState, setShapeState] = useState<ToolState>("idle");

  const [format, setFormat] = useState<ExportFormat>("wav");
  const [exportState, setExportState] = useState<ToolState>("idle");
  const [exportMessage, setExportMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFile, setDownloadFile] = useState("");
  const [renderedSummary, setRenderedSummary] = useState("");

  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const speedProblem = speedError(speed);
  const pitchProblem = pitchError(pitch);
  const reverbProblem = reverbError(reverb);
  const bassProblem = bassError(bass);
  const shapeProblem = speedProblem || pitchProblem || reverbProblem || bassProblem;

  const duration = track?.duration ?? 0;
  const settings = useMemo(
    () => settingsFrom(preset, speed, pitch, reverb, bass, trimStart, trimEnd, duration),
    [preset, speed, pitch, reverb, bass, trimStart, trimEnd, duration],
  );

  useEffect(() => {
    return () => {
      nodesRef.current?.source.stop();
      void contextRef.current?.close();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
    // The blob URL is revoked when a newer one replaces it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const context = contextRef.current;
      if (!context) return;
      const elapsed = (context.currentTime - startedAt.current) * (parseNumber(speed) ?? 1);
      const span = Math.max(0, settings.trimEnd - settings.trimStart);
      setPosition(Math.min(Math.max(0, elapsed), span || duration));
    }, 200);
    return () => window.clearInterval(timer);
  }, [playing, speed, settings.trimEnd, settings.trimStart, duration]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes || !playing) return;
    if (shapeProblem) return;
    applyLive(nodes, settings);
  }, [settings, playing, shapeProblem]);

  function context(): AudioContext {
    if (!contextRef.current || contextRef.current.state === "closed") {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }

  function stop() {
    const nodes = nodesRef.current;
    if (nodes) {
      try { nodes.source.stop(); } catch { /* already stopped */ }
      nodesRef.current = null;
    }
    setPlaying(false);
  }

  function remember(next: LoadedTrack) {
    stop();
    setTrack(next);
    setTrimStart("0");
    setTrimEnd("0");
    setLoadState("success");
    setLoadMessage("");
    setExportState("idle");
    setRenderedSummary("");
    setExportMessage("");
  }

  async function takeFile(file: File | null | undefined) {
    if (!file) {
      setLoadState("error");
      setLoadMessage("Choose an audio file");
      return;
    }
    if (!isAcceptedFile(file)) {
      setLoadState("error");
      setLoadMessage("That format is not supported. Use MP3, WAV, M4A, OGG or FLAC.");
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      setLoadState("error");
      setLoadMessage("This file is over 80 MB. Trim it first, then try again.");
      return;
    }
    setDecoding(true);
    setLoadState("working");
    setLoadMessage("");
    try {
      const decoded = await decodeFile(file);
      remember(decoded);
    } catch (error) {
      setLoadState("error");
      setLoadMessage(error instanceof Error ? error.message : "Could not decode this file. Try MP3, WAV, M4A, OGG or FLAC.");
    } finally {
      setDecoding(false);
    }
  }

  function loadSample() {
    const buffer = makeSampleBuffer();
    remember({
      name: "sample-pad.wav",
      format: "WAV",
      duration: buffer.duration,
      buffer,
      peaks: peaksFromBuffer(buffer),
    });
    setLoadMessage("Sample loaded — four seconds, ready to shape.");
  }

  function applyPreset(next: PresetId) {
    setPreset(next);
    if (next === "none") return;
    const recipe = PRESETS[next];
    setSpeed(String(recipe.speed));
    setPitch(String(recipe.pitch));
    setReverb(String(recipe.reverbPct));
    setBass(String(recipe.bassDb));
    setShapeState("success");
  }

  function onManual(setter: (value: string) => void) {
    return (value: string) => {
      setPreset("none");
      setter(value);
      setShapeState("success");
    };
  }

  function play() {
    if (!track) return;
    if (shapeProblem) {
      setShapeState("error");
      return;
    }
    const audio = context();
    void audio.resume();
    stop();
    const live = settingsFrom(preset, speed, pitch, reverb, bass, trimStart, trimEnd, track.duration);
    const nodes = wireGraph(audio, track.buffer, live, audio.destination);
    const span = Math.max(0.05, live.trimEnd - live.trimStart);
    nodes.source.start(0, live.trimStart, span);
    nodes.source.onended = () => {
      if (nodesRef.current === nodes) {
        nodesRef.current = null;
        setPlaying(false);
      }
    };
    nodesRef.current = nodes;
    startedAt.current = audio.currentTime;
    setPosition(0);
    setPlaying(true);
    setShapeState("success");
  }

  async function render() {
    if (!track) {
      setExportState("error");
      setExportMessage("Load an audio file first");
      setRenderedSummary("");
      return;
    }
    if (shapeProblem) {
      setExportState("error");
      setExportMessage(shapeProblem);
      setShapeState("error");
      return;
    }
    stop();
    setExportState("working");
    setProgress(0.04);
    setExportMessage("Rendering the edit offline, so the file matches the preview.");
    setRenderedSummary("");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl("");
    try {
      const live = settingsFrom(preset, speed, pitch, reverb, bass, trimStart, trimEnd, track.duration);
      const rendered = await renderOffline(track.buffer, live, setProgress);
      const blob = format === "mp3" ? await encodeMp3(rendered.buffer) : encodeWav(rendered.buffer);
      const url = URL.createObjectURL(blob);
      const fileName = downloadName(track.name, format);
      setDownloadUrl(url);
      setDownloadFile(fileName);
      setRenderedSummary(`${track.name} · ${formatSeconds(track.duration)} in · ${formatSeconds(rendered.duration)} out · ${format === "mp3" ? "MP3" : "WAV"}`);
      setExportMessage("");
      setExportState("success");
      setProgress(1);
    } catch {
      setExportState("error");
      setExportMessage("The render failed in this browser. Try WAV, or a shorter trim.");
      setProgress(0);
    }
  }

  const speedText = parseNumber(speed) === null ? speed : String(parseNumber(speed));

  const speedShown = parseNumber(speed);
  const trimShownEnd = settings.trimEnd;

  return (
    <div className="studio" data-instrument="slowed-reverb" id={`${idPrefix}-studio`}>
      <section
        className="deck deck-load"
        data-capability="audio-loader"
        data-operation="tool-spec"
        data-state={decoding ? "working" : loadState}
      >
        <header className="deck-head">
          <h2>Load a track</h2>
        </header>
        <div
          className={dragOver ? "drop is-over" : "drop"}
          onDragEnter={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void takeFile(event.dataTransfer.files?.[0]);
          }}
        >
          <svg className="drop-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
          </svg>
          <p className="drop-title">Drop a song here</p>
          <p className="drop-note">MP3, WAV, M4A, OGG or FLAC. It stays in this tab.</p>
          <div className="drop-actions">
            <label className="btn solid file-btn" htmlFor={`${reactId}-file`}>Choose file</label>
            <button type="button" className="btn ghost" onClick={loadSample}>Try the sample</button>
          </div>
          <input
            ref={fileRef}
            id={`${reactId}-file`}
            className="file-input"
            type="file"
            accept={ACCEPTED_EXT.map((ext) => `.${ext}`).join(",") + ",audio/*"}
            data-tool-input="audio-file"
            aria-label="Audio file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void takeFile(file ?? null);
            }}
          />
        </div>
        <div className="tool-output" data-tool-output>
          {loadState === "error" ? <p className="output-error" role="alert">{loadMessage}</p> : null}
          {track && loadState === "success" ? (
            <div className="chip-row">
              <span className="chip"><b>{track.name}</b></span>
              <span className="chip">{track.format}</span>
              <span className="chip">{formatSeconds(track.duration)}</span>
            </div>
          ) : null}
          {!track && loadState !== "error" ? <p className="output-hint">Choose an audio file, or press Try the sample.</p> : null}
          {loadMessage && loadState === "success" ? <p className="output-note">{loadMessage}</p> : null}
        </div>
        {decoding ? <p className="stage-line"><progress value={0.4} max={1} /> Decoding on this device…</p> : null}
      </section>

      <section
        className="deck deck-shape"
        data-capability="slowed-reverb-console"
        data-operation="tool-spec"
        data-state={shapeProblem && shapeState === "error" ? "error" : playing ? "working" : shapeState}
      >
        <header className="deck-head">
          <h2>Shape it live</h2>
        </header>

        <Waveform
          peaks={track?.peaks ?? []}
          duration={duration}
          trimStart={parseNumber(trimStart) ?? 0}
          trimEnd={trimShownEnd}
          position={playing ? position : 0}
          onTrim={(start, end) => {
            setTrimStart(start.toFixed(2));
            setTrimEnd(end.toFixed(2));
            setShapeState("success");
          }}
        />

        <div className="transport">
          <button type="button" className="btn solid" onClick={play} disabled={!track} aria-label="Play preview">
            {playing ? "Restart" : "Play preview"}
          </button>
          <button type="button" className="btn ghost" onClick={stop} disabled={!playing} aria-label="Stop">Stop</button>
          <span className="transport-pos" aria-live="polite">{playing ? `${position.toFixed(1)} s` : track ? "Ready" : "No track"}</span>
        </div>

        <fieldset className="preset-set">
          <legend>Preset</legend>
          <div role="radiogroup" aria-label="Preset" data-tool-input="preset" className="preset-row">
            {PRESET_OPTIONS.map((option) => (
              <label key={option.value} className={preset === option.value ? "preset on" : "preset"}>
                <input
                  type="radio"
                  name={`${idPrefix}-preset`}
                  value={option.value}
                  checked={preset === option.value}
                  onChange={() => applyPreset(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="sliders">
          <Slider id={`${idPrefix}-speed`} label="Speed" unit="×" min={SPEED_MIN} max={SPEED_MAX} step={0.01}
            value={speed} onChange={onManual(setSpeed)} hook="speed" error={speedProblem} />
          <Slider id={`${idPrefix}-pitch`} label="Pitch (semitones)" unit="st" min={PITCH_MIN} max={PITCH_MAX} step={1}
            value={pitch} onChange={onManual(setPitch)} hook="pitch" error={pitchProblem} />
          <Slider id={`${idPrefix}-reverb`} label="Reverb (%)" unit="%" min={0} max={REVERB_MAX} step={1}
            value={reverb} onChange={onManual(setReverb)} hook="reverb-pct" error={reverbProblem} />
          <Slider id={`${idPrefix}-bass`} label="Bass boost (dB)" unit="dB" min={0} max={BASS_MAX} step={1}
            value={bass} onChange={onManual(setBass)} hook="bass-db" error={bassProblem} />
        </div>

        <div className="trim-fields">
          <label>
            Trim start (s)
            <input type="number" inputMode="decimal" min={0} step={0.1} placeholder="0" data-tool-input="trim-start"
              value={trimStart} onChange={(event) => { setTrimStart(event.target.value); setShapeState("success"); }} />
          </label>
          <label>
            Trim end (s)
            <input type="number" inputMode="decimal" min={0} step={0.1} placeholder="0" data-tool-input="trim-end"
              value={trimEnd} onChange={(event) => { setTrimEnd(event.target.value); setShapeState("success"); }} />
          </label>
          <button type="button" className="btn ghost" onClick={() => { setTrimStart("0"); setTrimEnd("0"); }} disabled={!track}>
            Reset trim
          </button>
        </div>

        <div className="capability-actions">
          <button type="button" className="primary" data-jtbd-action="slowed-reverb-console" onClick={() => {
            if (shapeProblem) setShapeState("error");
            else { setShapeState("success"); if (track) play(); }
          }}>
            Apply shape
          </button>
        </div>
        <div className="tool-output readout" data-tool-output data-motion="value-tick">
          {shapeProblem && shapeState === "error" ? <p className="output-error" role="alert">{shapeProblem}</p> : null}
          {/* keyed on the preset so picking one replays the wave's entrance */}
          <ShapeMeter key={preset} speed={speedShown ?? 1} pitch={parseNumber(pitch) ?? 0} reverb={parseNumber(reverb) ?? 0} bass={parseNumber(bass) ?? 0} />
          <p className="readout-line">
            <span>Speed {speedShown === null ? speed : speedShown}×</span>
            <span>Pitch {parseNumber(pitch) ?? pitch} st</span>
            <span>Reverb {parseNumber(reverb) ?? reverb}%</span>
            <span>Bass {parseNumber(bass) ?? bass} dB</span>
            <span>Trim {Number(parseNumber(trimStart) ?? 0).toFixed(1)}–{Number(trimShownEnd || 0).toFixed(1)} s</span>
            <span>{PRESET_LABEL[preset]}</span>
          </p>
        </div>
        <p className="readout-plain sr-only">Speed {speedText}×, pitch {parseNumber(pitch) ?? pitch} st, reverb {parseNumber(reverb) ?? reverb}%, bass {parseNumber(bass) ?? bass} dB, trim {Number(parseNumber(trimStart) ?? 0).toFixed(1)} to {Number(trimShownEnd || 0).toFixed(1)}.</p>
      </section>

      <section
        className="deck deck-export"
        data-capability="wav-export"
        data-operation="tool-spec"
        data-state={exportState}
      >
        <header className="deck-head">
          <h2>Render and download</h2>
        </header>
        <fieldset className="format-set">
          <legend>Export format</legend>
          <div role="radiogroup" aria-label="Export format" data-tool-input="format" className="format-row">
            {(["wav", "mp3"] as ExportFormat[]).map((option) => (
              <label key={option} className={format === option ? "format on" : "format"}>
                <input
                  type="radio"
                  name={`${idPrefix}-format`}
                  value={option}
                  checked={format === option}
                  onChange={() => { setFormat(option); setExportState("idle"); setRenderedSummary(""); }}
                />
                <span>{option === "wav" ? "WAV" : "MP3"}</span>
                <small>{option === "wav" ? "Lossless, for editors" : "Smaller, for sharing"}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="capability-actions">
          <button type="button" className="primary" data-jtbd-action="wav-export" onClick={() => void render()}>
            {exportState === "working" ? "Rendering…" : "Render"}
          </button>
        </div>
        {exportState === "working" ? (
          <p className="stage-line">
            <progress value={progress} max={1} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} />
            <span>Rendering {Math.round(progress * 100)}%</span>
          </p>
        ) : null}
        <div className="tool-output" data-tool-output>
          {exportState === "error" ? <p className="output-error" role="alert">{exportMessage}</p> : null}
          {exportState === "success" && renderedSummary ? (
            <div className="export-ready">
              <p className="export-summary"><b>{renderedSummary}</b></p>
              <a className="btn solid download" href={downloadUrl} download={downloadFile}>Download {format === "mp3" ? "MP3" : "WAV"}</a>
            </div>
          ) : null}
          {exportState === "idle" ? <p className="output-hint">Render writes the file you just previewed. Nothing is uploaded.</p> : null}
        </div>
      </section>
    </div>
  );
}

function Slider({ id, label, unit, min, max, step, value, onChange, hook, error }: {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: string;
  onChange: (value: string) => void;
  hook: string;
  error: string | null;
}) {
  const numeric = parseNumber(value);
  const ratio = numeric === null ? 0 : Math.min(1, Math.max(0, (numeric - min) / (max - min)));
  return (
    <label className={error ? "slider bad" : "slider"} htmlFor={id}>
      <span className="slider-top">
        <span>{label}</span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={numeric === null ? min : Math.min(max, Math.max(min, numeric))}
        aria-valuetext={`${value} ${unit}`}
        onChange={(event) => onChange(event.target.value)}
        style={{ ["--fill" as string]: `${ratio * 100}%` }}
      />
      <span className="slider-field">
        <input
          className="slider-number"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          placeholder={String(min)}
          aria-label={label}
          data-tool-input={hook}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="slider-unit" aria-hidden="true">{unit}</span>
      </span>
      {error ? <span className="field-error" role="alert">{error}</span> : null}
    </label>
  );
}

function Waveform({ peaks, duration, trimStart, trimEnd, position, onTrim }: {
  peaks: number[];
  duration: number;
  trimStart: number;
  trimEnd: number;
  position: number;
  onTrim: (start: number, end: number) => void;
}) {
  const drag = useRef<"start" | "end" | null>(null);
  if (!peaks.length || duration <= 0) {
    return (
      <div className="wave empty">
        <span className="wave-empty-label">The waveform appears here once a track is loaded</span>
      </div>
    );
  }
  const startRatio = Math.min(1, Math.max(0, trimStart / duration));
  const endRatio = trimEnd > 0 ? Math.min(1, Math.max(startRatio, trimEnd / duration)) : 1;
  const playRatio = Math.min(1, Math.max(0, position / Math.max(0.001, (trimEnd || duration) - trimStart)));

  function at(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) * duration;
  }
  return (
    <div
      className="wave"
      role="slider"
      aria-label="Waveform trim"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration * 10) / 10}
      aria-valuenow={Math.round(trimStart * 10) / 10}
      aria-valuetext={`Trim ${trimStart.toFixed(1)} to ${(trimEnd || duration).toFixed(1)} seconds`}
      tabIndex={0}
      onPointerDown={(event) => {
        const time = at(event);
        const startDist = Math.abs(time - trimStart);
        const endDist = Math.abs(time - (trimEnd || duration));
        drag.current = startDist < endDist ? "start" : "end";
        event.currentTarget.setPointerCapture(event.pointerId);
        if (drag.current === "start") onTrim(Math.min(time, (trimEnd || duration) - 0.05), trimEnd || duration);
        else onTrim(trimStart, Math.max(time, trimStart + 0.05));
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const time = at(event);
        if (drag.current === "start") onTrim(Math.min(time, (trimEnd || duration) - 0.05), trimEnd || duration);
        else onTrim(trimStart, Math.max(time, trimStart + 0.05));
      }}
      onPointerUp={() => { drag.current = null; }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 1 : 0.1;
        if (event.key === "ArrowRight") { event.preventDefault(); onTrim(trimStart, Math.min(duration, (trimEnd || duration) + step)); }
        if (event.key === "ArrowLeft") { event.preventDefault(); onTrim(Math.max(0, trimStart - step), trimEnd || duration); }
      }}
    >
      {peaks.map((peak, index) => {
        const ratio = index / peaks.length;
        const inside = ratio >= startRatio && ratio <= endRatio;
        return <span key={index} className={inside ? "bar in" : "bar"} style={{ height: `${Math.max(6, peak * 100)}%` }} />;
      })}
      <i className="trim-mark start" style={{ left: `${startRatio * 100}%` }} />
      <i className="trim-mark end" style={{ left: `${endRatio * 100}%` }} />
      {position > 0 ? <i className="playhead" style={{ left: `${(startRatio + playRatio * (endRatio - startRatio)) * 100}%` }} /> : null}
    </div>
  );
}

/** The signature mark, live: pitch sets how dense the wave is, reverb how long
 *  its tail rings, bass how tall it stands, speed how fast it runs. */
function ShapeMeter({ speed, pitch, reverb, bass }: { speed: number; pitch: number; reverb: number; bass: number }) {
  const BARS = 60;
  const W = 300;
  const slot = W / BARS;
  const base = 58;
  // pitch sets how dense the wave runs, speed how fast it moves
  const cycles = 1.4 + ((pitch + 12) / 24) * 3.2 + (speed - 1) * 1.4;
  // reverb sets how long the tail rings before it fades
  const tail = 0.55 + reverb / 110;
  // bass sets how tall it stands
  const amp = 20 + Math.max(0, bass) * 3.4;
  const maxH = base - 6;
  return (
    <svg className="shape-meter" viewBox={`0 0 ${W} 64`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <line x1={2} y1={base} x2={W - 2} y2={base} stroke="currentColor" strokeOpacity="0.28" strokeDasharray="2 4" />
      {Array.from({ length: BARS }, (_, i) => {
        const env = Math.exp(-i / (BARS * tail * 0.55));
        const density = 0.35 + 0.65 * Math.abs(Math.sin((i / BARS) * Math.PI * 2 * cycles));
        const h = Math.min(maxH, Math.max(3.2, amp * (0.16 + 0.84 * env) * density));
        return (
          <rect
            key={i}
            className="shape-bar"
            x={2 + i * slot}
            y={base - h}
            width={Math.max(1.8, slot - 1.7)}
            height={h}
            rx={0.8}
            fill="currentColor"
            opacity={0.42 + env * 0.58}
            style={{ animationDelay: `${Math.min(i * 4, 220)}ms` }}
          />
        );
      })}
    </svg>
  );
}
