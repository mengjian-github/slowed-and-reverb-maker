"use client";

/**
 * The site's signature mark: a waveform that decays from left to right with a
 * reverb tail arcing under it. Heights come from a fixed formula (no random
 * values) so the server and client render the same bars.
 */
const BARS = 72;

function barHeight(index: number) {
  const t = index / (BARS - 1);
  const decay = Math.exp(-t * 1.25);
  const body = 0.34 + 0.66 * Math.abs(Math.sin(index * 0.62 + 0.4) * Math.cos(index * 0.21));
  return Math.max(0.04, Math.min(1, decay * body + 0.03));
}

export function WaveStrip({ note }: { note?: string }) {
  const width = 720;
  const height = 80;
  const slot = width / BARS;
  const base = height - 12;
  return (
    <figure className="wave-strip">
      {/* preserveAspectRatio="none" so the strip fills its box and starts on the
          hero's text edge at every width; with "meet" the 9:1 viewBox letterboxed
          inside the 12:1 hero row and the bars floated inset from the type. */}
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="A waveform decaying left to right with a reverb tail beneath it">
        {Array.from({ length: BARS }, (_, index) => {
          const h = barHeight(index) * (base - 4);
          return (
            <rect
              key={index}
              className="strip-bar"
              x={index * slot}
              y={base - h}
              width={Math.max(1.6, slot - 2.2)}
              height={h}
              style={{ animationDelay: `${Math.min(index * 7, 380)}ms` }}
            />
          );
        })}
        <path
          vectorEffect="non-scaling-stroke"
          className="strip-tail"
          d={`M0 ${base + 7} C ${width * 0.2} ${base + 7}, ${width * 0.26} ${height - 2}, ${width * 0.58} ${height - 2} S ${width * 0.9} ${base + 4}, ${width} ${base + 4}`}
        />
      </svg>
      <figcaption>
        {note ? <span className="strip-note">{note}</span> : null}
        <span className="strip-legend">
          <span><b>0.75×</b> daycore</span>
          <span><b>0.80×</b> slowed + reverb</span>
          <span><b>1.25×</b> nightcore</span>
          <span><b>1.50×</b> sped up</span>
        </span>
      </figcaption>
    </figure>
  );
}
