// Visual recipe for Slowed and Reverb Maker: burgundy ground, bubblegum accent,
// Chivo, square controls, outlined surfaces, noise grain. Renders after the
// platform stylesheet, so these rules own the look.
export const recipeStyles: string = `
:root {
  --background: #3d0012;
  --surface: #4d0519;
  --text: #ffe6f4;
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
}
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  opacity: 0.07;
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
h1, h2, h3 { text-transform: uppercase; letter-spacing: 0.01em; font-weight: 700; }

header[data-chrome="site"] {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, #3d0012 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent);
}
nav[data-node="nav"] {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.7rem 1.25rem;
  min-height: 4rem;
}
nav[data-node="nav"] .brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; font-weight: 700; letter-spacing: 0.01em; }
nav[data-node="nav"] .brand-logo { width: 2rem; height: 2rem; }
nav[data-node="nav"] .nav-links { display: flex; gap: 0.35rem 1.1rem; flex-wrap: wrap; }
nav[data-node="nav"] .nav-link { text-decoration: none; color: #ffe6f4; font-size: 0.92rem; padding: 0.35rem 0.1rem; border-bottom: 2px solid transparent; }
nav[data-node="nav"] .nav-link[aria-current="page"] { border-bottom-color: #ff99d3; color: #ff99d3; }
nav[data-node="nav"] .mobile-nav { display: none; }
nav[data-node="nav"] .nav-actions { margin-left: auto; }
.scroll-progress { position: fixed; top: 0; left: 0; height: 3px; width: 0; z-index: 50; background: #ff99d3; }
footer[data-node="footer"] { max-width: 1200px; margin: 0 auto; padding: 2.5rem 1.25rem 3rem; border-top: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent); }
.footer-groups { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.5rem; }
.footer-group { display: flex; flex-direction: column; gap: 0.4rem; }
.footer-group-title { font-weight: 700; text-transform: none; letter-spacing: 0; font-size: 0.95rem; color: #ff99d3; }
.footer-group a { color: #ffe6f4; text-decoration: none; min-height: 1.5rem; }
footer[data-node="footer"] { background: #3d0012 !important; color: #ffe6f4 !important; }
footer[data-node="footer"] a,
footer[data-node="footer"] .footer-group-title,
footer[data-node="footer"] .footer-note,
footer[data-node="footer"] .footer-brand,
footer[data-node="footer"] .footer-group a { color: #ffe6f4 !important; opacity: 1; background: transparent; }
footer[data-node="footer"] .footer-group a { min-height: 44px; display: flex; align-items: center; }
.footer-note { font-size: 0.95rem; max-width: 68ch; color: #ffe6f4 !important; background: #3d0012; line-height: 1.45; }

main { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem 3rem; }
.stage { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 1.25rem 1.5rem; align-items: start; padding: 1.25rem 0 1rem; }
.stage-tool { grid-column: 2; grid-row: 1 / span 3; }
.stage-still, .tempo-card { grid-column: 1; }
.stage-metrics { grid-column: 1; }
.kicker { margin: 0.45rem 0 0; color: #ff99d3; font-weight: 700; letter-spacing: 0.02em; text-transform: none; font-size: 0.95rem; }
.stage h1 { margin: 0; font-size: clamp(1.85rem, 1.1rem + 2.6vw, 3.4rem); line-height: 0.98; }
.lede { margin: 0.9rem 0 0; max-width: 62ch; font-size: 1.08rem; line-height: 1.55; }
.cta-row { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 1.2rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0.55rem 1.05rem; border: 1.5px solid #ff99d3; background: transparent; color: #ffe6f4; font: inherit; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; text-decoration: none; cursor: pointer; border-radius: 2px; }
.btn.solid { background: #ff99d3; color: #3d0012; border-color: #ff99d3; }
.btn.ghost { border-color: color-mix(in srgb, #ffe6f4 40%, transparent); }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.stage-metrics { display: flex; gap: 1.4rem; margin: 1.3rem 0 0; }
.stage-metrics div { display: grid; gap: 0.15rem; }
.stage-metrics dt { font-size: 0.85rem; letter-spacing: 0; text-transform: none; color: #ffc2e2; }
.stage-metrics dd { margin: 0; font-size: 1.35rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.stage-still { margin: 0; position: relative; }
.stage-still img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; object-position: center 30%; border-radius: 8px; max-height: 220px; filter: saturate(0.85) contrast(1.05); }
.stage-still figcaption { margin-top: 0.55rem; color: #ffc2e2; font-size: 0.9rem; display: grid; gap: 0.3rem; }
.still-chip { justify-self: start; background: #3d0012; color: #ff99d3; border: 1px solid #ff99d3; padding: 0.35rem 0.6rem; font-weight: 700; font-size: 0.85rem; letter-spacing: 0; }
.tempo-card { border: 1.5px solid color-mix(in srgb, #ffe6f4 30%, transparent); border-radius: 8px; padding: 0.8rem; color: #ff99d3; background: #4d0519; }
.tempo-card svg { width: 100%; height: auto; }
.tempo-card text { fill: currentColor; font-family: Chivo, system-ui, sans-serif; }

.studio { display: grid; gap: 1rem; margin: 0.5rem 0 2rem; }
.deck { border: 1.5px solid color-mix(in srgb, #ffe6f4 28%, transparent); background: #4d0519; border-radius: 8px; padding: 1rem 1rem 1.1rem; display: grid; gap: 0.8rem; }
.deck-head { display: flex; align-items: baseline; gap: 0.7rem; }
.deck-head h2 { margin: 0; font-size: 1.15rem; }
.deck-index { color: #ff99d3; font-weight: 700; font-variant-numeric: tabular-nums; }
.drop { position: relative; display: grid; justify-items: start; gap: 0.35rem; padding: 1.1rem; border-radius: 6px; }
.drop-dash { position: absolute; inset: 0; width: 100%; height: 100%; }
.drop-dash rect { fill: none; stroke: #c77aa0; stroke-width: 0.6; stroke-dasharray: 3 2; }
.drop.is-over .drop-dash rect { stroke: #ff99d3; animation: march 0.9s linear infinite; }
@keyframes march { to { stroke-dashoffset: -20; } }
.drop-title { margin: 0; font-weight: 700; font-size: 1.15rem; position: relative; }
.drop-note { margin: 0; color: #ffc2e2; font-size: 0.95rem; position: relative; }
.drop-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; position: relative; margin-top: 0.4rem; }
.file-input { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
.chip-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.chip { border: 1px solid color-mix(in srgb, #ffe6f4 30%, transparent); padding: 0.3rem 0.55rem; font-size: 0.9rem; }
.chip b { font-weight: 700; }
.output-error { margin: 0; color: #ffb4b4; font-weight: 700; }
.output-hint, .output-note { margin: 0; color: #ffc2e2; }
.stage-line { display: flex; align-items: center; gap: 0.6rem; margin: 0; font-size: 0.9rem; }
.stage-line progress { width: 8rem; accent-color: #ff99d3; }

.wave { position: relative; display: flex; align-items: center; gap: 2px; height: 92px; padding: 0.4rem; background: #3d0012; border-radius: 4px; cursor: ew-resize; touch-action: none; }
.wave.empty { opacity: 0.4; }
.wave .bar, .wave.empty span { flex: 1 1 0; background: color-mix(in srgb, #c77aa0 45%, transparent); border-radius: 1px; min-height: 4px; }
.wave .bar.in { background: #ff99d3; }
.trim-mark { position: absolute; top: 0; bottom: 0; width: 2px; background: #ffe6f4; }
.playhead { position: absolute; top: 0; bottom: 0; width: 2px; background: #ff99d3; }
.transport { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.transport-pos { font-variant-numeric: tabular-nums; color: #ffc2e2; }

.preset-set, .format-set { border: 0; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
.preset-set legend, .format-set legend, .slider-top span:first-child { font-size: 0.9rem; letter-spacing: 0; text-transform: none; color: #ffc2e2; }
.preset-row, .format-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.preset, .format { display: grid; min-height: 44px; align-content: center; padding: 0.4rem 0.75rem; border: 1.5px solid color-mix(in srgb, #ffe6f4 32%, transparent); cursor: pointer; border-radius: 2px; }
.preset input, .format input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.preset.on, .format.on { background: #ff99d3; color: #3d0012; border-color: #ff99d3; }
.format small { display: block; font-size: 0.85rem; }
.sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem 1.2rem; }
.slider { display: grid; gap: 0.3rem; }
.slider-top { display: flex; justify-content: space-between; gap: 0.5rem; }
.slider-value { font-variant-numeric: tabular-nums; font-weight: 700; color: #ff99d3; }
.slider input[type="range"] { width: 100%; accent-color: #ff99d3; min-height: 44px; }
.slider-number { width: 6.5rem; min-height: 44px; background: #3d0012; color: #ffe6f4; border: 1px solid color-mix(in srgb, #ffe6f4 30%, transparent); padding: 0 0.5rem; font: inherit; font-variant-numeric: tabular-nums; }
.slider.bad .slider-number, .field-error { border-color: #ffb4b4; }
.field-error { color: #ffb4b4; font-size: 0.9rem; font-weight: 700; }
.trim-fields { display: flex; flex-wrap: wrap; gap: 0.7rem; align-items: end; }
.trim-fields label { display: grid; gap: 0.25rem; font-size: 0.9rem; letter-spacing: 0; text-transform: none; color: #ffc2e2; }
.trim-fields input { min-height: 44px; width: 7rem; background: #3d0012; color: #ffe6f4; border: 1px solid color-mix(in srgb, #ffe6f4 30%, transparent); padding: 0 0.5rem; font: inherit; }
.capability-actions { display: flex; }
.capability-actions .primary { min-height: 44px; padding: 0.5rem 1.1rem; background: #ff99d3; color: #3d0012; border: 0; font: inherit; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; cursor: pointer; border-radius: 2px; }
.capability-actions .primary:active { transform: scale(0.97); }
.readout-line { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; margin: 0; font-variant-numeric: tabular-nums; font-weight: 700; }
.shape-meter { width: 100%; max-width: 280px; height: auto; color: #ff99d3; }
.export-ready { display: flex; flex-wrap: wrap; align-items: center; gap: 0.8rem; }
.export-summary { margin: 0; }

.band { padding: 2.4rem 0; border-top: 1px solid color-mix(in srgb, #ffe6f4 14%, transparent); display: grid; gap: 1rem; }
.band-head { display: grid; gap: 0.5rem; max-width: 68ch; }
.band h2 { margin: 0; font-size: clamp(1.5rem, 1.1rem + 1.4vw, 2.3rem); }
.band-lead { margin: 0; }
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.9rem; }
.steps { counter-reset: step; }
.steps li { display: grid; gap: 0.35rem; border: 1.5px solid color-mix(in srgb, #ffe6f4 24%, transparent); padding: 0.9rem 1rem; border-radius: 8px; }
.step-no { display: none; }
.steps h3, .spec-grid h3 { margin: 0 0 0.3rem; font-size: 1.05rem; }
.steps p, .spec-grid p { margin: 0; }
.spec-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 0.8rem; }
.spec-grid li { border: 1.5px solid color-mix(in srgb, #ffe6f4 24%, transparent); padding: 0.9rem 1rem; border-radius: 8px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
caption { text-align: left; font-weight: 700; margin-bottom: 0.5rem; }
th, td { text-align: left; padding: 0.55rem 0.7rem; border-bottom: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent); vertical-align: top; }
.checked { color: #ffc2e2; font-size: 0.9rem; }
.band-figure { margin: 0; }
.band-figure img { width: 100%; max-height: 420px; object-fit: cover; border-radius: 8px; filter: sepia(0.25) saturate(1.3) hue-rotate(300deg); }
.band-figure figcaption { margin-top: 0.45rem; color: #ffc2e2; font-size: 0.9rem; }
.faq { border-bottom: 1px solid color-mix(in srgb, #ffe6f4 16%, transparent); }
.faq h3 { margin: 0; font-size: 1rem; }
.faq button { all: unset; display: flex; justify-content: space-between; gap: 1rem; width: 100%; min-height: 48px; cursor: pointer; font: inherit; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; padding: 0.7rem 0; }
.faq p { margin: 0 0 0.9rem; max-width: 68ch; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }

@media (max-width: 800px) {
  .stage, .sliders, .footer-groups { grid-template-columns: 1fr; }
  .stage { padding: 0.15rem 0 0.1rem; gap: 0.35rem; }
  .stage-tool, .stage-still, .tempo-card, .stage-metrics { grid-column: auto; grid-row: auto; }
  .stage-still, .tempo-card, .stage-metrics { order: 4; }
  .kicker { font-size: 0.9rem; letter-spacing: 0; margin: 0.15rem 0 0; }
  .lede { font-size: 0.9rem; line-height: 1.3; margin-top: 0.2rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cta-row { margin-top: 0.35rem; gap: 0.4rem; }
  .cta-row .btn { min-height: 40px; padding: 0.3rem 0.7rem; font-size: 0.82rem; }
  .stage-metrics { margin-top: 0.4rem; gap: 0.7rem; }
  .stage-metrics dd { font-size: 1rem; }
  header[data-chrome="site"] { position: static; }
  nav[data-node="nav"] { min-height: 2.6rem; padding: 0.1rem 0.75rem; gap: 0.5rem; }
  nav[data-node="nav"] .brand-wordmark { font-size: 0.85rem; max-width: 11rem; line-height: 1.15; }
  nav[data-node="nav"] .brand-logo { width: 1.4rem; height: 1.4rem; }
  nav[data-node="nav"] .nav-links { display: none; }
  nav[data-node="nav"] .mobile-nav { display: block; margin-left: auto; }
  nav[data-node="nav"] .mobile-nav summary { list-style: none; min-width: 40px; min-height: 40px; display: grid; place-items: center; cursor: pointer; }
  nav[data-node="nav"] .mobile-nav summary::-webkit-details-marker { display: none; }
  nav[data-node="nav"] .mobile-nav-links { position: absolute; right: 0.6rem; top: 2.8rem; display: grid; gap: 0.2rem; background: #4d0519; border: 1px solid color-mix(in srgb, #ffe6f4 30%, transparent); padding: 0.6rem; min-width: 14rem; z-index: 30; }
  nav[data-node="nav"] .mobile-nav-links a { min-height: 44px; display: flex; align-items: center; padding: 0 0.4rem; text-decoration: none; color: #ffe6f4; }
  .stage h1 { font-size: 1.55rem; line-height: 1; margin: 0; }
  .deck { padding: 0.55rem 0.65rem; gap: 0.4rem; }
  .drop { padding: 0.55rem; }
  .drop-title { font-size: 1rem; }
}
@media (prefers-reduced-motion: reduce) {
  .drop.is-over .drop-dash rect { animation: none; }
  .btn:active, .capability-actions .primary:active { transform: none; }
}
`;
