// Visual recipe for Slowed and Reverb Maker: burgundy ground, bubblegum accent,
// Chivo, square controls, outlined surfaces, noise grain. Renders after the
// platform stylesheet, so these rules own the look.
export const recipeStyles: string = `
:root {
  --background: #3d0012;
  --surface: #4d0519;
  --surface-2: #5c0a21;
  --text: #ffe6f4;
  --ink-muted: #edc4d8;
  --accent: #ff99d3;
  --secondary: #c77aa0;
  --on-accent: #3d0012;
  --radius: 8px;
  --radius-control: 2px;
}
body {
  background-color: #3d0012;
  background-image:
    radial-gradient(ellipse 80% 50% at 100% -10%, #772e4c 0%, transparent 55%),
    radial-gradient(ellipse 60% 40% at -10% 20%, #541229 0%, transparent 50%);
  color: #ffe6f4;
  font-size: 1.0125rem;
  line-height: 1.58;
}
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>");
}
/* The platform paints a full-viewport atmosphere photo under the home page.
   On a phone that plate is ~740px tall and pushes the tool past the fold.
   Collapse it at every width: the first screen is the console, not a poster. */
.atmosphere-layer,
body[data-atmosphere="true"] .atmosphere-layer,
body[data-atmosphere="true"]::before {
  display: none !important;
  height: 0 !important;
  min-height: 0 !important;
}
/* Two registers: the display line is the only all-caps type on the page; section
   heads drop to sentence case so the eye gets a second step between 5rem and 12px. */
h1 { text-transform: uppercase; line-height: 0.92; letter-spacing: -0.02em; font-weight: 700; text-wrap: balance; }
h2 { text-transform: none; letter-spacing: -0.012em; font-weight: 700; }
h3 { text-transform: none; letter-spacing: -0.005em; font-weight: 700; }
p { line-height: 1.6; }

/* ---------- chrome ---------- */
header[data-chrome="site"] {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, #3d0012 90%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid color-mix(in srgb, #ffe6f4 14%, transparent);
}
nav[data-node="nav"] {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.55rem 1.25rem;
  min-height: 4rem;
}
nav[data-node="nav"] .brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; font-weight: 700; letter-spacing: 0; }
nav[data-node="nav"] .brand-wordmark { font-size: 1.1rem; line-height: 1.15; }
nav[data-node="nav"] .brand-logo { width: 2rem; height: 2rem; }
nav[data-node="nav"] .nav-links { display: flex; gap: 0.35rem 1.15rem; flex-wrap: wrap; }
nav[data-node="nav"] .nav-link { text-decoration: none; color: #ffe6f4; font-size: 0.95rem; padding: 0.4rem 0.05rem; border-bottom: 2px solid transparent; }
nav[data-node="nav"] .nav-link:hover { color: #ff99d3; }
nav[data-node="nav"] .nav-link[aria-current="page"] { border-bottom-color: #ff99d3; color: #ff99d3; }
nav[data-node="nav"] .mobile-nav { display: none; }
nav[data-node="nav"] .nav-actions { margin-left: auto; }
/* scroll-progress motif: a hairline that fills as the page is read. Kept inside
   @supports so a browser without scroll-driven animations never shows a full
   bar (an untimed animation would land on its end state). */
.scroll-progress { position: fixed; top: 0; left: 0; height: 3px; width: 100%; z-index: 50; background: #ff99d3; transform: scaleX(0); transform-origin: 0 50%; pointer-events: none; }
@supports (animation-timeline: scroll(root block)) {
  .scroll-progress { animation: progress-grow linear both; animation-timeline: scroll(root block); }
}
@keyframes progress-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

footer[data-node="footer"] {
  max-width: 1200px;
  margin: 1.5rem auto 0;
  padding: 2.2rem 1.25rem 3rem;
  border-top: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent);
  background: #3d0012 !important;
  color: #ffe6f4 !important;
}
.footer-groups { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.5rem; }
.footer-group { display: flex; flex-direction: column; gap: 0.3rem; }
.footer-group-title { font-weight: 700; text-transform: none; letter-spacing: 0; font-size: 0.92rem; color: #ff99d3; margin: 0 0 0.2rem; }
.footer-group a { color: #ffe6f4 !important; text-decoration: none; min-height: 40px; display: flex; align-items: center; }
.footer-group a:hover { color: #ff99d3 !important; }
.footer-note { font-size: 0.92rem; max-width: 72ch; color: #edc4d8 !important; background: transparent; line-height: 1.5; margin-top: 1.6rem; }
footer[data-node="footer"] .footer-group-title,
footer[data-node="footer"] p.footer-group-title,
footer[data-node="footer"] nav .footer-group-title { color: #ff99d3 !important; opacity: 1; }
footer[data-node="footer"] .footer-brand,
footer[data-node="footer"] p.footer-brand { color: #ffe6f4 !important; opacity: 1; }
footer[data-node="footer"] a,
footer[data-node="footer"] .footer-link,
footer[data-node="footer"] .footer-brand { color: #ffe6f4 !important; }
footer[data-node="footer"] .footer-group a:hover { color: #ff99d3 !important; }

/* ---------- hero ---------- */
main { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem 2rem; }
.hero-band { padding-block: clamp(1.2rem, 2.6vw, 2.2rem) 0; display: grid; }
.eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; margin: 0; color: #ff99d3; font-weight: 700; font-size: 0.875rem; letter-spacing: 0.02em; }
.eyebrow .dot { width: 8px; height: 8px; border-radius: 50%; background: #ff99d3; box-shadow: 0 0 0 4px color-mix(in srgb, #ff99d3 18%, transparent); }
.hero-band h1 { margin: 0.35rem 0 0; font-size: clamp(2.4rem, 1.1rem + 5.4vw, 5.5rem); max-width: 18ch; }
.lede { margin: 0.9rem 0 0; max-width: 64ch; font-size: clamp(1rem, 0.95rem + 0.3vw, 1.15rem); line-height: 1.62; color: #edc4d8; }
.cta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.7rem 1.2rem; margin-top: 1.3rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0.55rem 1.1rem; border: 1.5px solid #ff99d3; background: transparent; color: #ffe6f4; font: inherit; font-weight: 700; letter-spacing: 0; text-transform: none; text-decoration: none; cursor: pointer; border-radius: 2px; transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease; }
/* The page's own call to action is the filled one; a text link sits beside it. */
.cta-row .btn { min-height: 52px; padding: 0.72rem 1.55rem; background: #ff99d3; border-color: #ff99d3; color: #3d0012; font-size: 1.05rem; box-shadow: 0 12px 26px -18px #ff99d3; }
.cta-row .btn:hover { background: #ffb3de; border-color: #ffb3de; color: #3d0012; }
.cta-row .btn.link { min-height: 44px; padding: 0.35rem 0.1rem; background: transparent; border: 0; color: #ff99d3; font-weight: 700; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 5px; box-shadow: none; }
.cta-row .btn.link:hover { background: transparent; color: #ffe6f4; }
.cta-row .btn:focus-visible { outline: 2px solid #ffe6f4; outline-offset: 3px; }
.btn:hover { background: color-mix(in srgb, #ff99d3 16%, transparent); }
.btn.solid { background: #ff99d3; color: #3d0012; border-color: #ff99d3; }
.btn.solid:hover { background: #ffe6f4; border-color: #ffe6f4; color: #3d0012; }
.btn.ghost { border-color: color-mix(in srgb, #ffe6f4 38%, transparent); }
.btn.ghost:hover { background: color-mix(in srgb, #ff99d3 30%, #4d0519); border-color: #ff99d3; color: #ffe6f4; }
.btn.link { border-color: transparent; padding-inline: 0.2rem; text-decoration: underline; text-decoration-color: color-mix(in srgb, #ff99d3 60%, transparent); text-underline-offset: 4px; }
.btn.link:hover { background: transparent; color: #ff99d3; }
.btn:active { transform: scale(0.975); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* signature: the decaying waveform strip and its reverb tail */
.wave-strip { margin: 1.15rem 0 0; position: relative; }
/* a playhead crossing the strip, so the hero reads as a track playing rather
   than a decorative chart */
.wave-strip .strip-playhead { position: absolute; top: 0; left: 0; width: 1px; height: clamp(62px, 5.4vw, 92px); background: linear-gradient(to bottom, transparent, #ffe6f4 30%, #ffe6f4 70%, transparent); box-shadow: 0 0 10px 1px color-mix(in srgb, #ff99d3 70%, transparent); animation: strip-scan 7.5s cubic-bezier(0.5, 0, 0.5, 1) 1.4s infinite; pointer-events: none; }
@keyframes strip-scan { 0% { left: 0; opacity: 0; } 8% { opacity: 0.85; } 88% { opacity: 0.85; } 100% { left: 100%; opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .wave-strip .strip-playhead { display: none; } }
.wave-strip svg { display: block; width: 100%; height: clamp(62px, 5.4vw, 92px); color: #ff99d3; overflow: visible; }
.wave-strip .strip-bar { fill: currentColor; opacity: 0.85; transform-origin: center bottom; animation: strip-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
.wave-strip .strip-tail { fill: none; stroke: currentColor; stroke-width: 1.2; opacity: 0.5; stroke-dasharray: 900; stroke-dashoffset: 900; animation: strip-draw 1.1s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both; }
.wave-strip figcaption { margin-top: 0.6rem; display: grid; gap: 0.35rem; }
.wave-strip .strip-note { color: #edc4d8; font-size: 0.875rem; }
.wave-strip .strip-legend { display: flex; flex-wrap: wrap; gap: 0.3rem 1.25rem; color: #edc4d8; font-size: 0.875rem; }
.wave-strip .strip-legend b { color: #ff99d3; font-variant-numeric: tabular-nums; }
@keyframes strip-in { from { transform: scaleY(0.08); opacity: 0; } to { transform: none; opacity: 0.85; } }
@keyframes strip-draw { to { stroke-dashoffset: 0; } }

/* Hero: the signature waveform in the tool's own deck frame */
.deck-signal { margin-top: 0.9rem; padding: 0.7rem 1rem 0.8rem; }
.deck-signal .deck-head { align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 0.35rem 0.9rem; padding-bottom: 0.55rem; }
.deck-signal .deck-head h2 { font-size: 0.98rem; letter-spacing: -0.005em; }
.deck-signal .wave-strip { margin-top: 0.45rem; }
.deck-signal .wave-strip svg { height: clamp(58px, 4.6vw, 76px); }
.signal-values { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.875rem; font-weight: 700; color: #ff99d3; font-variant-numeric: tabular-nums; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ff99d3; animation: live-pulse 2.4s ease-in-out infinite; }
@keyframes live-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, #ff99d3 55%, transparent); opacity: 1; } 50% { box-shadow: 0 0 0 5px color-mix(in srgb, #ff99d3 0%, transparent); opacity: 0.7; } }
@media (prefers-reduced-motion: reduce) { .live-dot { animation: none; } }
.hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 372px); gap: 1.4rem; align-items: start; padding-block: 1.4rem 0; }
/* Wider screens: the console panel and the split board bleed into the gutter so
   the first line of their copy sits on the same edge as the header and bands. */
@media (min-width: 1280px) {
  .hero-grid { margin-inline: -1.05rem; }
  main section.split-band { margin-inline: -1.35rem; }
}
.rail { display: grid; gap: 1rem; align-content: start; }
/* The console runs long; pin the rail so the photograph and its checklist stay
   with the visitor instead of ending in a hole beside the render deck. */
@media (min-width: 901px) {
  .rail { position: sticky; top: 4.9rem; }
}
.stage-still { margin: 0; }
.still-frame { position: relative; display: block; border-radius: 8px; overflow: hidden; background: #4d0519; }
.still-frame::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255, 153, 211, 0.10) 0%, rgba(55, 0, 16, 0) 45%, rgba(55, 0, 16, 0.45) 100%); pointer-events: none; }
.stage-still img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; object-position: 58% 34%; filter: saturate(1.06) contrast(1.08) brightness(1.14); transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.stage-still:hover img { transform: scale(1.03); }
/* the preset caption rides the photograph's lower edge, so the picture carries
   the panel's reading instead of a chip floating under it */
.still-frame .still-chip { position: absolute; left: 0.6rem; bottom: 0.6rem; z-index: 2; background: color-mix(in srgb, #3d0012 86%, transparent); backdrop-filter: blur(4px); }
.stage-still figcaption { margin-top: 0.55rem; color: #edc4d8; font-size: 0.875rem; display: grid; gap: 0.4rem; }
.still-chip { justify-self: start; background: #4d0519; color: #ff99d3; border: 1px solid color-mix(in srgb, #ff99d3 50%, transparent); padding: 0.3rem 0.55rem; font-weight: 700; font-size: 0.875rem; font-variant-numeric: tabular-nums; }
.stage-metrics { display: flex; flex-wrap: wrap; gap: 0.9rem 1.6rem; margin: 0; padding: 0.85rem 0 0; border-top: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent); }
.stage-metrics div { display: grid; gap: 0.1rem; }
.stage-metrics dt { font-size: 0.8rem; letter-spacing: 0; text-transform: none; color: #edc4d8; }
.stage-metrics dd { margin: 0; font-size: 1.2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.rail-facts { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; font-size: 0.92rem; color: #edc4d8; }
.rail-facts li { display: grid; grid-template-columns: 1rem 1fr; gap: 0.55rem; align-items: start; }
.rail-facts svg { width: 1rem; height: 1rem; margin-top: 0.25rem; color: #ff99d3; }
.night-facts { margin-top: 1.3rem; padding-top: 0.9rem; border-top: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent); }
@media (min-width: 901px) {
  .stage-copy { position: sticky; top: 5rem; }
}

/* nightcore hero: split media, its own tree */
.stage { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); gap: 1.4rem 1.6rem; align-items: start; padding-block: clamp(1.4rem, 3.2vw, 2.6rem) 0; }
.stage-copy { display: grid; align-content: start; }
.stage h1 { margin: 0.55rem 0 0; font-size: clamp(2.1rem, 1.2rem + 4vw, 4.2rem); }
.stage-tool { min-width: 0; }
.tempo-card { border: 1.5px solid color-mix(in srgb, #ffe6f4 26%, transparent); border-radius: 8px; padding: 0.9rem; color: #ff99d3; background: #4d0519; }
.tempo-card svg { width: 100%; height: auto; display: block; }
.tempo-card text { fill: currentColor; font-family: Chivo, system-ui, sans-serif; }
.speed-card { margin-top: 1.5rem; border: 1.5px solid color-mix(in srgb, #ffe6f4 26%, transparent); border-radius: 8px; padding: 0.9rem 1rem; color: #ff99d3; background: #4d0519; }
.speed-card svg { width: 100%; height: auto; display: block; }
.speed-card text { fill: currentColor; font-family: Chivo, system-ui, sans-serif; }
.speed-card p { margin: 0.45rem 0 0; color: #edc4d8; font-size: 0.875rem; }

/* ---------- console decks ---------- */
.studio { display: grid; gap: 1rem; margin: 0; }
/* The instrument's one status line: the same place answers idle, working,
   error and done, so a press is never silent. */
.studio-status { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin: 0; padding: 0.6rem 0.85rem; border: 1px solid color-mix(in srgb, #ffe6f4 26%, transparent); border-radius: 6px; background: #4d0519; color: #edc4d8; font-size: 0.95rem; font-weight: 600; }
.studio-status .status-dot { flex: none; width: 0.62rem; height: 0.62rem; border-radius: 50%; background: currentColor; }
.studio-status .status-text { min-width: 0; }
.status-fix { margin-left: auto; flex: none; border: 1px solid currentColor; border-radius: 2px; background: transparent; color: inherit; font: inherit; font-size: 0.85rem; font-weight: 700; padding: 0.25rem 0.6rem; min-height: 32px; cursor: pointer; }
.status-fix:hover { background: color-mix(in srgb, currentColor 18%, transparent); }
.status-fix:focus-visible { outline: 2px solid #ff99d3; outline-offset: 2px; }
.drop-status { display: flex; align-items: baseline; gap: 0.55rem; margin: 0; padding: 0.5rem 0.7rem; border: 1px solid color-mix(in srgb, #ffe6f4 22%, transparent); border-radius: 6px; background: color-mix(in srgb, #ffe6f4 6%, transparent); color: #edc4d8; font-size: 0.92rem; font-weight: 600; }
.drop-status .status-dot { flex: none; align-self: center; width: 0.55rem; height: 0.55rem; border-radius: 50%; background: currentColor; }
.drop-status.working { color: #ffd6ec; border-color: #ff99d3; background: color-mix(in srgb, #ff99d3 16%, #4d0519); }
.drop-status.working .status-dot { animation: status-pulse 1s ease-in-out infinite alternate; }
.drop-status.error { color: #ffb4b4; border-color: #ffb4b4; background: color-mix(in srgb, #ef4444 22%, #4d0519); }
.drop-status.success { color: #ffe6f4; border-color: color-mix(in srgb, #22c55e 62%, transparent); background: color-mix(in srgb, #22c55e 12%, #4d0519); }
@media (prefers-reduced-motion: reduce) { .drop-status.working .status-dot { animation: none; } }
.capability-actions .primary.busy { background: #ffc2e4; cursor: progress; }
.studio-status.working { color: #ff99d3; border-color: #ff99d3; background: color-mix(in srgb, #ff99d3 14%, #4d0519); }
.studio-status.working .status-dot { animation: status-pulse 1s ease-in-out infinite alternate; }
.studio-status.error { color: #ffb4b4; border-color: #ffb4b4; background: color-mix(in srgb, #ef4444 20%, #4d0519); }
.studio-status.success { color: #ffe6f4; border-color: color-mix(in srgb, #22c55e 70%, transparent); background: color-mix(in srgb, #22c55e 14%, #4d0519); }
@keyframes status-pulse { from { opacity: 1; } to { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) { .studio-status.working .status-dot { animation: none; } }
.drop[data-state="working"] { border-style: solid; border-color: #ff99d3; background: color-mix(in srgb, #ff99d3 10%, transparent); }
.drop[data-state="error"] { border-style: solid; border-color: #ffb4b4; background: color-mix(in srgb, #ef4444 14%, transparent); }
/* The state of the main action, printed beside the button that sets it. */
.capability-actions { align-items: center; gap: 0.85rem; flex-wrap: wrap; }
.action-state { font-size: 0.9rem; font-weight: 700; color: #edc4d8; }
.action-state.working { color: #ff99d3; }
.action-state.error { color: #ffb4b4; }
.deck { border: 1px solid color-mix(in srgb, #ffe6f4 26%, transparent); background: #4d0519; border-radius: 8px; padding: 1.2rem 1.35rem 1.4rem; display: grid; gap: 1.05rem; animation: rise-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
.deck:nth-child(2) { animation-delay: 0.07s; }
.deck:nth-child(3) { animation-delay: 0.14s; }
@keyframes rise-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.deck-head { display: flex; align-items: baseline; gap: 0.65rem; padding-bottom: 0.7rem; border-bottom: 1px solid color-mix(in srgb, #ffe6f4 14%, transparent); }
.deck-head h2 { margin: 0; font-size: 1.26rem; letter-spacing: -0.012em; text-transform: none; }
.drop { position: relative; display: grid; justify-items: center; text-align: center; gap: 0.45rem; padding: 1.5rem 1.1rem 1.4rem; border: 1.5px dashed color-mix(in srgb, #ff99d3 42%, transparent); border-radius: 8px; transition: background-color 0.18s ease, border-color 0.18s ease; }
.drop:hover, .drop:focus-within { background: color-mix(in srgb, #ff99d3 7%, transparent); border-color: #ff99d3; }
.drop.is-over { background: color-mix(in srgb, #ff99d3 14%, transparent); border-color: #ffe6f4; }
.drop-icon { width: 30px; height: 30px; color: #ff99d3; position: relative; }
@keyframes march { to { stroke-dashoffset: -20; } }
.drop-title { margin: 0; font-weight: 700; font-size: 1.05rem; position: relative; }
.drop-note { margin: 0; color: #edc4d8; font-size: 0.92rem; position: relative; }
.drop-actions { display: flex; gap: 0.5rem 0.9rem; flex-wrap: wrap; align-items: center; justify-content: center; position: relative; margin-top: 0.45rem; }
.file-btn { position: relative; cursor: pointer; overflow: hidden; }
.file-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; font-size: 0; }
.file-btn:focus-within { outline: 2px solid #ffe6f4; outline-offset: 3px; }
.chip-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.chip { border: 1px solid color-mix(in srgb, #ffe6f4 26%, transparent); padding: 0.28rem 0.5rem; font-size: 0.875rem; }
.chip b { font-weight: 700; }
.output-error { margin: 0; color: #ffb4b4; font-weight: 700; display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
.sample-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.output-hint, .output-note { margin: 0; color: #edc4d8; font-size: 0.94rem; }
.stage-line { display: flex; align-items: center; gap: 0.6rem; margin: 0; font-size: 0.9rem; }
.stage-line progress { width: 8rem; accent-color: #ff99d3; }

.wave { position: relative; display: flex; align-items: center; gap: 2px; height: 92px; padding: 0.4rem; background: #370010; border-radius: 4px; cursor: ew-resize; touch-action: none; }
.wave.empty { display: flex; align-items: center; justify-content: center; border: 1px dashed color-mix(in srgb, #ffe6f4 22%, transparent); background: #370010; }
.wave-empty-label { color: #edc4d8; font-size: 0.875rem; letter-spacing: 0; text-align: center; padding: 0 0.75rem; }
.wave .bar { flex: 1 1 0; background: color-mix(in srgb, #c77aa0 55%, transparent); border-radius: 1px; min-height: 4px; }
.wave .bar.in { background: #ff99d3; }
.trim-mark { position: absolute; top: 0; bottom: 0; width: 2px; background: #ffe6f4; }
.playhead { position: absolute; top: 0; bottom: 0; width: 2px; background: #ff99d3; }
.transport { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.transport-pos { font-variant-numeric: tabular-nums; color: #edc4d8; }

.preset-set, .format-set { border: 0; margin: 0; padding: 0; display: grid; gap: 0.45rem; }
/* console labels: sentence case, one readable step under the body copy — the
   tracked 11px capitals read as a template tell, so they are gone. */
.preset-set legend, .format-set legend { font-size: 0.9rem; letter-spacing: 0; text-transform: none; color: #edc4d8; font-weight: 600; padding: 0; }
.preset-row, .format-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.preset, .format { display: flex; align-items: center; gap: 0.45rem; min-height: 44px; padding: 0.35rem 0.75rem; border: 1.5px solid color-mix(in srgb, #ffe6f4 28%, transparent); cursor: pointer; border-radius: 2px; transition: border-color 0.16s ease, background-color 0.16s ease, transform 0.12s ease; }
.preset:active, .format:active { transform: scale(0.97); }
/* each preset carries the site's mark drawn at its own reverb tail */
.preset-glyph { flex: none; width: 30px; height: 14px; fill: currentColor; opacity: 0.9; }
.preset:hover, .format:hover { border-color: #ff99d3; background: color-mix(in srgb, #ff99d3 9%, transparent); transform: translateY(-1px); }
.preset input:focus-visible + span, .format input:focus-visible + span { outline: 2px solid #ffe6f4; outline-offset: 2px; }
.preset:has(input:focus-visible), .format:has(input:focus-visible) { outline: 2px solid #ffe6f4; outline-offset: 2px; }
.preset input, .format input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.preset input:focus-visible + span, .format input:focus-visible + span { outline: 2px solid #ffe6f4; outline-offset: 2px; }
.preset.on, .format.on { background: #ff99d3; color: #3d0012; border-color: #ff99d3; animation: preset-set 0.42s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes preset-set { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, #ff99d3 70%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
.format small { display: block; font-size: 0.8rem; opacity: 0.85; }
.sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 1.15rem 1.5rem; }
.slider { display: grid; grid-template-columns: minmax(0, 1fr) 5.2rem; align-items: center; gap: 0.2rem 0.6rem; }
.slider-top { grid-column: 1 / -1; display: flex; justify-content: space-between; gap: 0.5rem; align-items: baseline; }
.slider-top span:first-child { font-size: 0.92rem; letter-spacing: 0; text-transform: none; color: #edc4d8; font-weight: 600; transition: color 0.15s ease; }
.slider:hover .slider-top span:first-child, .slider:focus-within .slider-top span:first-child { color: #ff99d3; }
input[type="range"]:hover::-webkit-slider-thumb { box-shadow: 0 0 0 5px color-mix(in srgb, #ffe6f4 24%, transparent); }
input[type="range"]:active::-webkit-slider-thumb { background: #ff99d3; border-color: #ffe6f4; transform: scale(1.1); }
input[type="range"]::-webkit-slider-thumb { transition: box-shadow 0.15s ease, transform 0.12s ease, background-color 0.12s ease; }
input[type="range"]:hover::-moz-range-thumb { box-shadow: 0 0 0 5px color-mix(in srgb, #ffe6f4 24%, transparent); }
input[type="range"]:active::-moz-range-thumb { background: #ff99d3; transform: scale(1.1); }
input[type="range"]::-moz-range-thumb { transition: box-shadow 0.15s ease, transform 0.12s ease, background-color 0.12s ease; }
.slider input[type="range"] { grid-column: 1; width: 100%; min-height: 40px; margin: 0; }
.slider-field { position: relative; grid-column: 2; display: flex; align-items: center; }
.slider .slider-number { width: 100%; min-width: 0; min-height: 40px; text-align: left; background: #370010; color: #ffe6f4; font-weight: 700; border: 1px solid color-mix(in srgb, #ff99d3 34%, transparent); border-radius: 2px; padding: 0 1.75rem 0 0.5rem; font: inherit; font-weight: 700; font-variant-numeric: tabular-nums; transition: border-color 0.14s ease, box-shadow 0.14s ease; }
.slider .slider-number:hover { border-color: #ff99d3; }
.slider .slider-number:focus-visible { border-color: #ff99d3; outline: 2px solid #ff99d3; outline-offset: 1px; }
.slider-unit { position: absolute; right: 0.5rem; color: #edc4d8; font-size: 0.875rem; pointer-events: none; }
/* the slider is the control; native spinners sat on top of the unit and clipped
   the readout ("1.2" of 1.25) in a 5.2rem field */
.slider .slider-number::-webkit-outer-spin-button,
.slider .slider-number::-webkit-inner-spin-button { -webkit-appearance: none; appearance: none; margin: 0; }
.slider .slider-number { -moz-appearance: textfield; appearance: textfield; }
.shape-meter { display: block; width: 100%; height: 64px; max-width: none; margin-top: 0.5rem; color: #ff99d3; }
.slider.bad .slider-number, .field-error { border-color: #ffb4b4; }
.field-error { color: #ffb4b4; font-size: 0.9rem; font-weight: 700; }
.trim-fields { display: flex; flex-wrap: wrap; gap: 0.7rem; align-items: end; }
.trim-fields label { display: grid; gap: 0.25rem; font-size: 0.9rem; letter-spacing: 0; text-transform: none; color: #edc4d8; }
.trim-fields input { min-height: 44px; width: 6.5rem !important; background: #370010; color: #ffe6f4; border: 1px solid color-mix(in srgb, #ffe6f4 28%, transparent); border-radius: 2px; padding: 0 0.5rem; font: inherit; }
.capability-actions { display: flex; }
.capability-actions .primary { min-height: 50px; padding: 0.65rem 1.5rem; background: #ff99d3; color: #3d0012; border: 0; font: inherit; font-size: 1.02rem; font-weight: 700; letter-spacing: 0; cursor: pointer; border-radius: 2px; box-shadow: 0 0 0 1px color-mix(in srgb, #ffe6f4 32%, transparent), 0 10px 22px -14px #ff99d3; transition: background-color 0.16s ease, box-shadow 0.16s ease; }
.capability-actions .primary:hover { background: #ffe6f4; color: #3d0012; box-shadow: 0 0 0 2px #ff99d3; }
.capability-actions .primary:active { transform: scale(0.975); }
.readout-line { display: flex; flex-wrap: wrap; gap: 0.35rem 1.05rem; margin: 0; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 1rem; animation: rise-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
.readout-line span:last-child { color: #ff99d3; }
/* The shape preview is the result, so it gets the deck's full width and height. */
.shape-meter { display: block; width: 100%; height: 84px; max-width: none; margin: 0.5rem 0 0; color: #ff99d3; overscroll-behavior: contain; }
.shape-meter .shape-bar { transform-box: fill-box; transform-origin: center; animation: bar-rise 0.46s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes bar-rise { from { transform: scaleY(0.06); opacity: 0; } to { transform: none; opacity: 1; } }
.export-ready { display: flex; flex-wrap: wrap; align-items: center; gap: 0.8rem; animation: rise-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
.export-summary { margin: 0; }

/* native form controls, styled to the console */
input[type="range"] { -webkit-appearance: none; appearance: none; height: 40px; background: transparent; cursor: pointer; }
input[type="range"]::-webkit-slider-runnable-track { height: 8px; border-radius: 999px; background: linear-gradient(to right, #ff99d3 0 var(--fill, 0%), color-mix(in srgb, #ff99d3 22%, #370010) var(--fill, 0%) 100%); }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; margin-top: -6px; border: 2px solid #3d0012; border-radius: 3px; background: #ffe6f4; box-shadow: 0 0 0 1px color-mix(in srgb, #ffe6f4 45%, transparent); }
input[type="range"]:focus-visible::-webkit-slider-thumb { outline: 2px solid #ffe6f4; outline-offset: 2px; }
input[type="range"]::-moz-range-track { height: 8px; border-radius: 999px; background: color-mix(in srgb, #ff99d3 22%, #370010); }
input[type="range"]::-moz-range-progress { height: 8px; border-radius: 999px; background: #ff99d3; }
input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; border: 2px solid #3d0012; border-radius: 3px; background: #ffe6f4; }
input[type="number"], input[type="text"], select, textarea { background: #370010; color: #ffe6f4; border: 1px solid color-mix(in srgb, #ffe6f4 28%, transparent); border-radius: 2px; }
input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #ff99d3; outline-offset: 1px; }

/* ---------- editorial bands ---------- */
.band { padding-block: clamp(2rem, 4.2vw, 3.4rem); border-top: 1px solid color-mix(in srgb, #ffe6f4 14%, transparent); display: grid; gap: 1.15rem; }
.band-head { display: grid; gap: 0.55rem; max-width: 70ch; }
.band h2 { margin: 0; font-size: clamp(1.36rem, 1.15rem + 0.85vw, 1.75rem); letter-spacing: -0.012em; }
.band-lead { margin: 0; color: #edc4d8; max-width: 70ch; }
/* ProseBlock: approved copy's blank lines become real paragraphs. */
.lede > p, .band-lead > p, .faq > div > p { margin: 0 0 0.7rem; max-width: none; }
.lede > p:last-child, .band-lead > p:last-child, .faq > div > p:last-child { margin-bottom: 0; }
@media (min-width: 1000px) {
  /* A heading over a 70ch column leaves the right third of every band empty.
     Put the heading in its own column and the lead beside it. */
  .band-head { grid-template-columns: minmax(0, 0.56fr) minmax(0, 1fr); gap: 0.4rem 2rem; align-items: start; max-width: none; }
  .band-head .band-lead { max-width: 66ch; }
}
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.35rem; counter-reset: step; }
.steps li { display: grid; grid-template-columns: 2.3rem minmax(0, 1fr); gap: 0.95rem; border: 0; padding: 0.9rem 1rem; align-items: start; }
.step-no { display: grid; place-items: center; width: 2.3rem; height: 2.3rem; border: 1.5px solid #ff99d3; border-radius: 50%; color: #ff99d3; font-weight: 700; font-variant-numeric: tabular-nums; counter-increment: step; }
.step-no::before { content: counter(step); }
.steps h3, .spec-grid h3 { margin: 0 0 0.35rem; font-size: 1.1rem; }
.steps p, .spec-grid p { margin: 0; color: #edc4d8; }
.steps p:not(:last-child), .spec-grid p:not(:last-child) { margin-bottom: 0.6rem; }
.spec-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1.4rem 1.8rem; }
.spec-grid li { border: 0; padding: 0.9rem 1rem; }
.table-wrap { overflow-x: auto; padding: 1rem 1.1rem; background: #4d0519; border: 1px solid color-mix(in srgb, #ffe6f4 14%, transparent); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; }
caption { text-align: left; font-weight: 700; margin-bottom: 0.6rem; }
th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid color-mix(in srgb, #ffe6f4 14%, transparent); vertical-align: top; }
th { font-size: 0.875rem; letter-spacing: 0.02em; text-transform: none; color: #edc4d8; font-weight: 700; }
.checked { color: #edc4d8; font-size: 0.875rem; margin: 0.6rem 0 0; }
.band-figure { margin: 0; max-width: 920px; }
.band-figure img { width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 8px; filter: saturate(1.05); }
.band-figure figcaption { margin-top: 0.5rem; color: #edc4d8; font-size: 0.875rem; }
.figure-credit, .still-credit { margin: 0.25rem 0 0; color: #edc4d8; font-size: 0.75rem; opacity: 0.85; }
.figure-credit a, .still-credit a { color: inherit; }
.faq-band { padding-bottom: clamp(1.5rem, 3vw, 2.5rem); }
.faq { border-bottom: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent); }
.faq h3 { margin: 0; font-size: 1.02rem; }
.faq button { all: unset; display: flex; justify-content: space-between; gap: 1rem; width: 100%; min-height: 52px; cursor: pointer; font: inherit; font-weight: 700; text-transform: none; letter-spacing: 0; padding: 0.8rem 0; }
.faq button:hover { color: #ff99d3; }
.faq button span { color: #ff99d3; font-size: 1.2rem; line-height: 1; }
.faq p { margin: 0 0 1rem; max-width: 74ch; color: #edc4d8; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }

@media (max-width: 900px) {
  .hero-grid, .stage { grid-template-columns: 1fr; }
  .rail { order: 3; }
  .stage-still, .stage-metrics, .tempo-card { order: 4; }
  /* Nightcore hero on a phone: the copy flattens into the stage grid so the
     console follows the headline and the facts/metrics trail it, instead of
     the checklist pushing the tool past the fold. */
  .stage-copy { display: contents; }
  .stage-copy > h1, .stage-copy > .lede, .stage-copy > .cta-row { order: 1; margin-block: 0; }
  .stage-copy > .cta-row { margin-top: 0.2rem; }
  .stage-tool { order: 2; }
  .stage-copy > .stage-metrics, .stage-copy > .rail-facts { order: 3; }
  .stage { gap: 0.75rem; }
}
@media (max-width: 800px) {
  body { font-size: 1rem; }
  main { padding: 0 1rem 2rem; }
  .hero-band { padding-block: 0.45rem 0; }
  .hero-band h1 { font-size: clamp(1.9rem, 8.6vw, 2.5rem); }
  .lede { font-size: 0.875rem; line-height: 1.42; margin-top: 0.45rem; }
  .cta-row { gap: 0.35rem 0.9rem; margin-top: 0.7rem; }
  .cta-row .btn { min-height: 42px; font-size: 0.875rem; padding: 0.4rem 0.8rem; }
  .wave-strip { margin-top: 0.6rem; }
  .wave-strip svg { height: 44px; }
  .wave-strip figcaption { font-size: 0.75rem; gap: 0.2rem; margin-top: 0.35rem; }
  .wave-strip .strip-note { display: none; }
  /* the legend rags when it wraps by flow; two columns keep the ×-scale aligned */
  .wave-strip .strip-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 0.28rem 0.9rem; }
  /* "Slowed and Reverb Maker" broke onto two lines beside the menu button */
  nav[data-node="nav"] .brand-wordmark { font-size: 0.9rem; white-space: nowrap; }
  nav[data-node="nav"] .brand-logo { width: 1.65rem; height: 1.65rem; }
  .hero-grid, .stage { gap: 0.85rem; padding-block: 0.5rem 0; }
  .deck { gap: 0.7rem; }
  .steps { gap: 0.8rem; }
  .spec-grid { gap: 0.8rem; }
  .capability-actions { display: grid; }
  .capability-actions .primary { width: 100%; }
  /* the platform cards sections on a phone; these sections are edges, not cards */
  main .hero-grid, main .stage, main .band, main .faq-band, main .hero-band, main .recipe-band { background: none !important; box-shadow: none !important; border-radius: 0 !important; }
  /* On a phone the console reads as one continuous instrument panel: no stacked
     cards, hairline rules, text on the page edge like the rest of the page. */
  main .deck { background: none; border: 0; border-top: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); border-radius: 0; padding: 0.9rem 0 0; }
  main .split-panel { background: none; border: 0; border-top: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); border-radius: 0; padding: 0.9rem 0 0; }
  .band { padding-block: 1.8rem; gap: 0.9rem; }
  .sliders { grid-template-columns: 1fr; gap: 0.9rem; }
  .shape-meter { height: 66px; }

  /* The load deck is one compact row on a phone: the drop target, the two
     buttons and the format line sit in a band about a third as tall, so the
     shaping controls below them stay near the first screen. */
  main .deck { padding: 0.7rem 0 0; gap: 0.55rem; }
  .deck-head { padding-bottom: 0.45rem; }
  .deck-head h2 { font-size: 1.06rem; }
  main .deck-load .drop { grid-template-columns: auto minmax(0, 1fr); justify-items: start; text-align: left; gap: 0.1rem 0.7rem; padding: 0.6rem 0.75rem 0.65rem; }
  main .deck-load .drop-icon { grid-row: 1 / span 2; width: 20px; height: 20px; align-self: center; }
  .drop-title { font-size: 0.95rem; }
  .drop-note { font-size: 0.75rem; }
  .drop-actions { grid-column: 2; justify-content: flex-start; margin-top: 0.4rem; gap: 0.4rem 0.6rem; }
  .drop-actions .btn { min-height: 40px; font-size: 0.875rem; padding: 0.3rem 0.7rem; }
  main .deck-load .tool-output { margin-top: 0; }
  /* the hint repeats what the drop zone already says; dropping it keeps the
     shaping controls one scroll shorter on a phone */
  main .deck-load .output-hint { display: none; }
  .output-hint { font-size: 0.875rem; }
  .wave.empty { height: 56px; }
  /* Before a track is loaded the waveform placeholder and the transport say
     nothing useful; hiding them on a phone brings the real controls up into
     the first screen. Both appear the moment a file decodes. */
  .deck-shape[data-has-track="false"] .wave,
  .deck-shape[data-has-track="false"] .transport { display: none; }
  /* the nightcore hero's decorative speed card would push the console off the fold */
  .stage-copy .speed-card { display: none; }
  .slider input[type="range"] { min-height: 34px; }
  .trim-fields { gap: 0.55rem; }

  .drop { padding: 0.8rem; }
  .drop-title { font-size: 1rem; }
  .table-wrap { padding: 0.85rem 0.9rem; }
  th, td { padding: 0.5rem 0.55rem; font-size: 0.94rem; }
  .footer-groups { grid-template-columns: 1fr 1fr; gap: 1rem 1.25rem; }
  header[data-chrome="site"] { position: sticky; }
  nav[data-node="nav"] { min-height: 3.4rem; padding: 0.35rem 1rem; gap: 0.5rem; }
  nav[data-node="nav"] .brand-wordmark { font-size: 0.98rem; max-width: 12rem; }
  nav[data-node="nav"] .brand-logo { width: 1.7rem; height: 1.7rem; }
  nav[data-node="nav"] .nav-links { display: none; }
  nav[data-node="nav"] .mobile-nav { display: block; margin-left: auto; }
  nav[data-node="nav"] .mobile-nav summary { list-style: none; min-width: 44px; min-height: 44px; display: grid; place-items: center; cursor: pointer; border: 1px solid color-mix(in srgb, #ffe6f4 26%, transparent); border-radius: 2px; }
  nav[data-node="nav"] .mobile-nav summary::-webkit-details-marker { display: none; }
  nav[data-node="nav"] .mobile-nav-links { position: absolute; right: 0.75rem; top: 3.6rem; display: grid; gap: 0.15rem; background: #4d0519; border: 1px solid color-mix(in srgb, #ffe6f4 30%, transparent); padding: 0.6rem; min-width: 14rem; z-index: 30; }
  nav[data-node="nav"] .mobile-nav-links a { min-height: 44px; display: flex; align-items: center; padding: 0 0.4rem; text-decoration: none; color: #ffe6f4; }
}
/* ---------- guide: the classic recipe as a scale ---------- */
.recipe-band { padding: 1.8rem 0 0.4rem; }
.band-label { margin: 0 0 0.8rem; font-size: 1.02rem; color: #ff99d3; text-transform: none; letter-spacing: 0; }
.recipe-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem 1.6rem; margin: 0; padding: 1.1rem 0 1.3rem; border-top: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); border-bottom: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); }
.recipe-item { display: grid; gap: 0.25rem; }
.recipe-item dt { color: #edc4d8; font-size: 0.9rem; }
.recipe-item dd { margin: 0; display: grid; gap: 0.3rem; }
.recipe-value { font-size: clamp(1.5rem, 1.2rem + 1vw, 2rem); font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.05; }
.recipe-scale { height: 6px; margin-top: 0.2rem; background: #370010; border: 1px solid color-mix(in srgb, #ffe6f4 18%, transparent); }
.recipe-scale span { display: block; height: 100%; background: #ff99d3; }
.recipe-note { margin: 0.2rem 0 0; color: #edc4d8; font-size: 0.875rem; }

/* Beat grid: the guide's own drawing — same beats at three speeds, tick
   positions computed from each preset's number. */
.beat-figure { margin: 1.6rem 0 0; padding: 0 0 1.5rem; display: grid; gap: 1rem; border-bottom: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); }
.beat-figure figcaption { display: grid; gap: 0.15rem; }
.beat-caption { font-weight: 700; font-size: 1rem; }
.beat-legend { color: #edc4d8; font-size: 0.875rem; max-width: 62ch; }
.beat-rows { display: grid; gap: 0.85rem; }
.beat-row { display: grid; grid-template-columns: minmax(0, 13.5rem) 1fr; gap: 1.1rem; align-items: center; }
.beat-label { display: grid; gap: 0.1rem; }
.beat-label b { font-size: 0.95rem; font-weight: 700; }
.beat-label span { color: #c77aa0; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.beat-track { position: relative; height: 30px; background: #370010; border: 1px solid color-mix(in srgb, #ffe6f4 14%, transparent); }
.beat-tick { position: absolute; top: 7px; bottom: 7px; width: 2px; margin-left: -1px; background: color-mix(in srgb, #ff99d3 62%, transparent); }
.beat-tick.strong { top: 0; bottom: 0; width: 3px; margin-left: -1.5px; background: #ff99d3; }
@media (max-width: 800px) {
  .beat-row { grid-template-columns: 1fr; gap: 0.4rem; }
  .beat-track { height: 26px; }
}

/* ---------- comparison: two directions on one scale ---------- */
main section.split-band { display: grid; grid-template-columns: minmax(0, 1fr) 2rem minmax(0, 1fr); gap: 1.2rem; align-items: stretch; padding: 2rem 0 1.2rem; }
.split-panel { display: grid; align-content: start; gap: 1rem; padding: 1.3rem 1.35rem 1.4rem; border: 1px solid color-mix(in srgb, #ffe6f4 22%, transparent); border-radius: 8px; background: #4d0519; }
.split-panel header { display: grid; gap: 0.3rem; }
.split-panel h2 { margin: 0; font-size: clamp(1.35rem, 1.1rem + 0.9vw, 1.8rem); }
.split-tag { color: #ff99d3; font-weight: 700; font-size: 0.9rem; }
.split-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
.split-list li { display: grid; grid-template-columns: 1fr auto; gap: 0.15rem 1rem; }
.split-label { color: #edc4d8; font-size: 0.92rem; }
.split-value { font-weight: 700; font-variant-numeric: tabular-nums; }
.split-track { grid-column: 1 / -1; height: 5px; background: #370010; border: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent); }
.split-track span { display: block; height: 100%; background: #ff99d3; }
.split-slow .split-track span { background: #c77aa0; }
.split-divider { align-self: stretch; justify-self: center; border-left: 1px dashed color-mix(in srgb, #ffe6f4 30%, transparent); }
.split-panel .btn { justify-self: start; }

/* ---------- about: where the audio goes ---------- */
main section.flow-band { padding: 1.8rem 0 0.6rem; }
.flow-caption { margin: 0 0 0.9rem; color: #edc4d8; font-size: 0.94rem; }
.flow-strip { list-style: none; margin: 0; padding: 1.1rem 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.4rem; border-top: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); border-bottom: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); }
.flow-strip li { position: relative; display: grid; gap: 0.2rem; }
.flow-node { color: #ff99d3; }
.flow-node svg { width: 2.2rem; height: 2.2rem; display: block; }
.flow-title { font-weight: 700; font-size: 1.05rem; }
.flow-note { color: #edc4d8; font-size: 0.875rem; }
.flow-link { position: absolute; top: 1.1rem; right: -0.9rem; width: 1.4rem; height: 1px; background: color-mix(in srgb, #ffe6f4 35%, transparent); }

/* ---------- legal and contact documents ---------- */
.doc-shell { display: grid; grid-template-columns: minmax(0, 210px) minmax(0, 1fr); gap: 2.4rem; padding: 2rem 0 1rem; align-items: start; }
.doc-toc { position: sticky; top: 5.4rem; display: grid; gap: 0.6rem; padding-top: 0.3rem; }
.doc-toc-title { margin: 0; color: #ff99d3; font-weight: 700; font-size: 0.92rem; }
.doc-toc ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.15rem; border-left: 1px solid color-mix(in srgb, #ffe6f4 22%, transparent); }
.doc-toc a { display: flex; min-height: 40px; align-items: center; padding: 0 0.2rem 0 0.8rem; color: #edc4d8; text-decoration: none; font-size: 0.92rem; border-left: 2px solid transparent; margin-left: -1px; }
.doc-toc a:hover { color: #ffe6f4; border-left-color: #ff99d3; }
.doc-toc-cta { margin-top: 0.8rem; }
.doc-toc-cta .cta-row { margin-top: 0; display: grid; justify-items: start; gap: 0.4rem; }
.doc-toc-cta .btn { min-height: 42px; font-size: 0.92rem; padding: 0.4rem 0.8rem; }
.doc-head { display: grid; gap: 0.5rem; padding-bottom: 1.2rem; border-bottom: 1px solid color-mix(in srgb, #ffe6f4 20%, transparent); }
.doc-head h1 { margin: 0; font-size: clamp(1.9rem, 1.4rem + 2vw, 3rem); }
.doc-head .lede { margin: 0; }
.doc-body main section, .doc-body section.band { padding-block: 1.5rem; }
.doc-body section.band h2 { font-size: clamp(1.2rem, 1.05rem + 0.7vw, 1.55rem); }
.doc-body .band-head { max-width: 68ch; }
@media (min-width: 1000px) {
  /* Inside the document column the band head stays one column: the two-column
     split leaves the lead wrapping in a 300px ribbon. */
  .doc-body .band-head { grid-template-columns: 1fr; gap: 0.5rem; max-width: 68ch; }
}
.doc-body .spec-grid { grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr)); }
.doc-body .steps li, .doc-body .spec-grid li { border: 0; padding: 0.9rem 1rem; }
.doc-body .table-wrap { background: #4d0519; }
.doc-body .faq-band { padding-bottom: 0.6rem; }

main section.band { padding-block: 2.4rem; }
main section.band.faq-band { padding-bottom: 1rem; }

@media (max-width: 900px) {
  .recipe-strip { grid-template-columns: 1fr 1fr; gap: 1rem 1.2rem; }
  main section.split-band { grid-template-columns: 1fr; gap: 0.9rem; }
  .split-divider { display: none; }
  .flow-strip { grid-template-columns: 1fr; gap: 1rem; }
  .flow-link { display: none; }
  .doc-shell { grid-template-columns: 1fr; gap: 1.2rem; padding-top: 1rem; }
  .doc-toc { position: static; }
  .doc-toc ol { grid-template-columns: 1fr 1fr; }
  .doc-toc-cta .cta-row { flex-direction: row; }
}
@media (prefers-reduced-motion: reduce) {
  .btn:active, .capability-actions .primary:active { transform: none; }
  .wave-strip .strip-bar, .wave-strip .strip-tail, .deck, .readout-line { animation: none; opacity: 1; transform: none; }
  .shape-meter .shape-bar { animation: none; opacity: 1; transform: none; }
}
`;
