// The site's visual recipe — Slowed and Reverb Maker, "burgundy-bubblegum",
// Chivo, mission-console, neo-memphis. SiteStyleRenderer renders this string
// right after the platform stylesheet (lib/site-styles.ts), so these rules
// have the last word on the look. No fetching, no executing, no page covering.

export const recipeStyles: string = `
/* ---- tokens ------------------------------------------------------- */
:root {
  --background: #3d0012;
  --surface: #4d0519;
  --surface-2: #541229;
  --text: #ffe6f4;
  --text-muted: #e5b9d4;
  --accent: #ff99d3;
  --accent-strong: #ffc2e4;
  --secondary: #c77aa0;
  --line: color-mix(in srgb, var(--accent) 24%, transparent);
  --line-strong: color-mix(in srgb, var(--accent) 45%, transparent);
  --radius: 12px;
  --radius-lg: 18px;
  --ease: cubic-bezier(0.3, 0, 0.2, 1);
  --grad: linear-gradient(180deg, #541229, #772e4c);
}

/* ---- base ---------------------------------------------------------- */
html { scroll-behavior: smooth; }
body {
  background: var(--background);
  color: var(--text);
  font-family: Chivo, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}
h1, h2, h3 { font-weight: 900; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.02; }
a { color: var(--accent); }
::selection { background: var(--accent); color: #3d0012; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ---- header / topbar ---------------------------------------------- */
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, #3d0012 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.topbar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.7rem clamp(1rem, 3vw, 2rem);
  display: flex;
  align-items: center;
  gap: 1.2rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  color: var(--text);
  text-decoration: none;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.95rem;
}
.brand-mark { color: var(--accent); flex: none; }
.brand-logo { height: 1.4rem; width: auto; flex: none; }
.brand-name { white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 359.5px) { .brand-name { display: none; } }
.nav-links { display: flex; align-items: center; gap: 0.2rem; margin-inline-start: auto; }
.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: color 160ms var(--ease), border-color 160ms var(--ease);
}
.nav-link:hover { color: var(--text); border-color: var(--line); }
.nav-link[aria-current="page"] { color: var(--accent); border-color: var(--line-strong); }
details.nav-group { position: relative; }
details.nav-group summary {
  cursor: pointer;
  list-style: none;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  padding: 0.55rem 0.8rem;
}
details.nav-group summary::-webkit-details-marker { display: none; }
details.nav-group[open] summary { color: var(--accent); }
.nav-group-links {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 15rem;
  display: grid;
  padding: 0.5rem;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.7);
}
.nav-fmts {
  display: none;
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  color: var(--secondary);
  text-transform: uppercase;
}
@media (min-width: 980px) { .nav-fmts { display: block; } }
details.mobile-nav { margin-inline-start: auto; position: relative; }
@media (min-width: 720px) {
  details.mobile-nav summary svg { display: none; }
  details.mobile-nav > .mobile-nav-links { display: contents; }
  details.mobile-nav .mobile-nav-fmts { display: none; }
}
@media (max-width: 719.5px) {
  .nav-links { display: none; }
  details.mobile-nav summary { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; }
  details.mobile-nav summary::-webkit-details-marker { display: none; }
  details.mobile-nav[open] summary { border-color: var(--accent); color: var(--accent); }
  .mobile-nav-links {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: min(18rem, 82vw);
    display: grid;
    gap: 0.25rem;
    padding: 0.75rem;
    background: var(--surface);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    box-shadow: 0 22px 44px -18px rgba(0, 0, 0, 0.75);
  }
  .mobile-nav-links .nav-link { padding: 0.8rem 0.9rem; font-size: 0.9rem; }
  .mobile-nav-fmts { font-size: 0.68rem; letter-spacing: 0.22em; color: var(--secondary); padding: 0.5rem 0.9rem 0.2rem; }
}
.scroll-progress {
  position: absolute;
  inset-inline: 0;
  bottom: -1px;
  height: 2px;
  background: var(--accent);
  transform-origin: 0 50%;
  transform: scaleX(0);
}

/* ---- footer -------------------------------------------------------- */
.site-footer {
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, #2b000d, #3d0012);
  position: relative;
  z-index: 1;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1rem, 3vw, 2rem) 1.5rem;
  display: grid;
  gap: 2rem;
}
.footer-brand-row { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
.footer-brand { font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text); }
/* the platform stylesheet sets this span at display size (80px dark-on-dark,
   reads as broken); the brand row is a small baseline row here. */
.site-footer .footer-brand { font-size: clamp(1rem, 1.6vw, 1.25rem); color: var(--text); }
.hero-figure svg { display: block; width: 100%; height: auto; }
.hero-figure .style-ladder text { font-family: inherit; }
.footer-tagline { color: var(--accent); font-weight: 700; font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase; }
.footer-groups {
  display: grid;
  gap: 1.5rem 2.5rem;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
}
.footer-group { display: grid; gap: 0.5rem; align-content: start; }
.footer-group-title {
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--accent);
}
.footer-group a { display: block; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; padding: 0.15rem 0; }
.footer-group a:hover { color: var(--accent); }
.footer-nav { display: flex; flex-wrap: wrap; gap: 0.5rem 1.4rem; }
.footer-nav a { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; }
.footer-note, .footer-contact, .footer-legal { margin: 0; font-size: 0.82rem; color: var(--text-muted); }
.footer-legal { border-top: 1px solid var(--line); padding-top: 1rem; color: var(--secondary); }

/* ---- studio frame / hero ------------------------------------------ */
.atmosphere-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.16;
  filter: saturate(0.7) hue-rotate(-20deg);
  pointer-events: none;
}
.studio-page { position: relative; z-index: 1; }
.shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem) clamp(3rem, 7vw, 5rem);
  display: grid;
  gap: clamp(2.5rem, 6vw, 4.5rem);
}
.hero-type h1 {
  font-size: clamp(2.6rem, 8.2vw, 6.4rem);
  margin: 0;
  text-wrap: balance;
}
.h-block {
  color: #26000b;
  background: var(--accent);
  padding: 0 0.14em;
  border-radius: 6px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
.band-wrap { margin: clamp(0.8rem, 2vw, 1.4rem) 0 clamp(1.2rem, 3vw, 2rem); }
.band { display: block; width: 100%; height: clamp(46px, 7vw, 90px); }
.band .bar { fill: var(--accent); transform-origin: bottom; animation: bandPulse 2.4s var(--ease) infinite; }
.band .arc { stroke: var(--line-strong); }
.band .base { stroke: var(--line); }
@keyframes bandPulse {
  0%, 100% { transform: scaleY(1); }
  45% { transform: scaleY(0.42); opacity: 0.55; }
}
.hero-grid {
  display: grid;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  align-items: start;
}
@media (max-width: 1023.5px) { .hero-grid { grid-template-columns: minmax(0, 1fr); } }
/* Phone first screen: headline, then the tool. Picture and mast move out of the way. */
@media (max-width: 719.5px) {
  .hero-type h1 { font-size: clamp(2.1rem, 9.5vw, 2.8rem); }
  .band-wrap { margin: 0.4rem 0 0.7rem; }
  .band { height: 38px; }
  .shell { padding-top: 1rem; }
  .hero-grid { gap: 1.1rem; }
  .hero-figure { display: none; }
  .atmosphere-layer { display: none; }
  /* Headline, then the tool; the hero's supporting copy follows the console. */
  .hero-copy { order: 2; }
  .voice-sub { font-size: 0.92rem; }
  .lede { font-size: 0.9rem; }
  .mobile-nav:not([open]) .mobile-nav-links { display: none; }
  .topbar { padding-top: 0.45rem; padding-bottom: 0.45rem; }
  .mast { padding: 0.45rem 0.7rem; }
  .mnum { font-size: 1.15rem; }
  .lede { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .voice { font-size: 1rem; }
  .ctas { margin-top: 0; }
  .ctas button, .primary, button.primary { padding: 0.7rem 1.1rem; min-height: 44px; }
  .mast { gap: 0.6rem; padding: 0.55rem 0.8rem; }
  .mnum { font-size: 1.3rem; }
  .mast-ticks { display: none; }
}
.hero-copy { display: grid; gap: 0.9rem; align-content: start; }
.voice { margin: 0; font-weight: 900; text-transform: uppercase; font-size: clamp(1.05rem, 2vw, 1.3rem); color: var(--accent); letter-spacing: 0.04em; }
.voice-sub { margin: 0; font-weight: 700; color: var(--text); }
.lede { margin: 0; color: var(--text); max-width: 68ch; line-height: 1.6; }
.ctas { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 0.4rem; }
.ctas button, .primary, button.primary {
  cursor: pointer;
  font-family: inherit;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.85rem;
  border-radius: 8px;
  padding: 0.85rem 1.3rem;
  min-height: 44px;
  transition: transform 160ms var(--ease), background-color 160ms var(--ease), color 160ms var(--ease), border-color 160ms var(--ease);
}
.ctas .btn-primary, .primary, button.primary {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #26000b;
}
.ctas .btn-ghost, .panel button:not(.primary) {
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--text);
}
.ctas button:hover, .panel button:hover { border-color: var(--accent); }
.ctas button:active, .panel button:active { transform: scale(0.97); }
.panel button:disabled { opacity: 0.45; cursor: not-allowed; }
.hero-figure { margin: 0; display: grid; gap: 0.5rem; align-content: start; }
.hero-figure img {
  width: 100%;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  aspect-ratio: 4 / 3;
  object-fit: cover;
  filter: saturate(0.85) contrast(1.05) hue-rotate(-14deg);
  box-shadow: 0 30px 60px -30px rgba(0, 0, 0, 0.8);
}
.hero-figure figcaption, .editorial-figure figcaption {
  font-size: 0.8rem;
  color: var(--secondary);
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.hero-figure figcaption svg { color: var(--accent); }

/* ---- console / instrument ------------------------------------------ */
.console-wrap { display: grid; gap: 1rem; }
.sr-root { display: grid; gap: 1rem; }
.mast {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}
.mast-val { display: grid; }
.mnum { font-weight: 900; font-size: 1.7rem; font-variant-numeric: tabular-nums; color: var(--accent); line-height: 1; }
.mlab { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--secondary); }
.mast-ticks { display: flex; gap: 1.2rem; margin-inline-start: auto; flex-wrap: wrap; }
.tick { display: grid; font-size: 0.78rem; font-variant-numeric: tabular-nums; }
.tick::before { content: attr(data-label); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--secondary); }
.wav-chip {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--accent);
  border: 1px dashed var(--line-strong);
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
}
.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 88%, transparent), color-mix(in srgb, #4d0519 92%, transparent));
  padding: clamp(1rem, 2.4vw, 1.6rem);
  display: grid;
  gap: 0.9rem;
  box-shadow: 0 24px 50px -32px rgba(0, 0, 0, 0.85);
}
/* dropzone: Lucian #032 port */
.dropzone {
  display: block;
  cursor: pointer;
  position: relative;
  border-radius: var(--radius);
  padding: clamp(1.4rem, 4vw, 2.2rem) 1rem;
  text-align: center;
  display: grid;
  gap: 0.8rem;
  justify-items: center;
  transition: transform 200ms var(--ease), background-color 200ms var(--ease);
}
.dropzone.is-over { transform: scale(1.015); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.dropzone::before { content: ""; position: absolute; inset: 0; border: 2px dashed var(--accent); border-radius: 18px; pointer-events: none; animation: dashPulse 3.2s var(--ease) infinite; }
.dropzone.is-over::before { border-style: solid; animation: none; }
@keyframes dashPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@media (prefers-reduced-motion: no-preference) {
}
.orb {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 32% 30%, #ffc2e4, #c77aa0 62%, #772e4c);
  color: #3d0012;
  font-weight: 900;
}
.dropzone-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; }
.privacy-note { margin: 0; font-size: 0.78rem; color: var(--text-muted); text-align: center; }
.sr-file { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
.tool-output { display: grid; gap: 0.8rem; }
.loader-output .hint, .readout .hint { margin: 0; font-size: 0.8rem; color: var(--text-muted); }
.msg { margin: 0; font-weight: 700; font-size: 0.9rem; }
.msg.err { color: #ff8a80; }
.msg.ok { color: var(--accent-strong); }
.loaded { display: grid; gap: 0.7rem; }
.chip-row { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--text-muted);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chip-strong { color: #3d0012; background: var(--accent); border-color: var(--accent); }
canvas.wave { width: 100%; height: 96px; display: block; border-radius: 8px; background: #2b000d; border: 1px solid var(--line); cursor: crosshair; }
.transport { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
.transport .time { margin-inline-start: auto; font-variant-numeric: tabular-nums; font-size: 0.85rem; color: var(--text-muted); }
.field-row { display: flex; flex-wrap: wrap; gap: 0.9rem; align-items: end; }
.fgrid { display: grid; gap: 0.9rem 1.1rem; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); }
.field { display: grid; gap: 0.35rem; min-width: 0; }
.field-label {
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.field-label .val { color: var(--accent); font-variant-numeric: tabular-nums; }
.field input[type="range"] { width: 100%; accent-color: var(--accent); min-height: 24px; }
.field input[type="number"], .field select {
  font-family: inherit;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  background: #2b000d;
  border: 1.5px solid var(--line-strong);
  border-radius: 8px;
  padding: 0.6rem 0.7rem;
  min-height: 44px;
  width: 100%;
}
.field input[type="number"]:focus, .field select:focus { border-color: var(--accent); outline: none; }
.field input[data-invalid] { border-color: #ff8a80; }
.readout-list { margin: 0; display: grid; gap: 0.6rem 1.4rem; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); }
.readout-list dt { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--secondary); }
.readout-list dd { margin: 0; font-weight: 900; font-size: 1.15rem; font-variant-numeric: tabular-nums; color: var(--accent); }
.export-row { align-items: center; }
.render-progress { display: grid; gap: 0.4rem; }
.render-progress progress { width: 100%; height: 10px; accent-color: var(--accent); }
.export-done { display: grid; gap: 0.7rem; }
.export-headline { margin: 0; font-weight: 900; text-transform: uppercase; color: var(--accent-strong); }
.export-facts { margin: 0; display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; font-size: 0.85rem; color: var(--text-muted); }
.download-btn {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--accent);
  color: #3d0012;
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 0.85rem 1.3rem;
  min-height: 44px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-decoration: none;
}
.download-btn:hover { background: var(--accent-strong); }
.download-btn:active { transform: scale(0.97); }
.capability-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.capability-help { margin: 0; font-size: 0.8rem; color: var(--text-muted); }

/* ---- sections ------------------------------------------------------ */
.sec { display: grid; gap: 1rem; align-content: start; border-top: 1px solid var(--line); padding-top: clamp(1.5rem, 3vw, 2.2rem); }
.sec > h2 { margin: 0; font-size: clamp(1.5rem, 3.4vw, 2.3rem); }
.sec-body { margin: 0; color: var(--text-muted); line-height: 1.65; max-width: 68ch; }
.sec-body a { color: var(--accent); }
.split-row { display: grid; gap: clamp(1.5rem, 3vw, 3rem); grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); }
@media (max-width: 900px) { .split-row { grid-template-columns: minmax(0, 1fr); } }
.cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
.card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.1rem 1.2rem;
  background: color-mix(in srgb, var(--surface) 55%, transparent);
  display: grid;
  gap: 0.5rem;
  align-content: start;
  transition: border-color 200ms var(--ease), translate 200ms var(--ease);
}
.card:hover { border-color: var(--line-strong); translate: 0 -2px; }
.card h3 { margin: 0; font-size: 1rem; color: var(--accent-strong); }
.card p { margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.55; }
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; counter-reset: none; }
.step { display: flex; gap: 0.9rem; align-items: start; }
.step-num {
  flex: none;
  font-weight: 900;
  color: var(--accent);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}
.step h3 { margin: 0 0 0.25rem; font-size: 0.98rem; }
.step p { margin: 0; font-size: 0.88rem; color: var(--text-muted); line-height: 1.55; }
.spec-table-wrap { margin: 0; display: grid; gap: 0.5rem; }
.spec-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.spec-table caption { text-align: start; font-weight: 700; color: var(--secondary); padding-bottom: 0.5rem; font-size: 0.85rem; }
.spec-table th, .spec-table td { text-align: start; padding: 0.6rem 0.75rem; border: 1px solid var(--line); }
.spec-table th { font-weight: 900; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.1em; color: var(--accent); background: color-mix(in srgb, var(--surface) 70%, transparent); }
.spec-table td { color: var(--text-muted); }
.spec-table tr:hover td { background: color-mix(in srgb, var(--accent) 7%, transparent); }
.table-note { margin: 0; font-size: 0.78rem; color: var(--secondary); }
.editorial-figure { margin: 0; display: grid; gap: 0.5rem; }
.editorial-figure img {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  filter: saturate(0.85) contrast(1.05) hue-rotate(-14deg);
}
.faq { display: grid; gap: 0.6rem; }
.faq-item {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 55%, transparent);
}
.faq-item summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1.1rem;
  font-weight: 700;
  color: var(--text);
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary svg { flex: none; color: var(--accent); transition: rotate 200ms var(--ease); }
.faq-item[open] summary { color: var(--accent); }
.faq-item[open] summary svg { rotate: 180deg; }
.faq-item > p { margin: 0; padding: 0 1.1rem 1rem; color: var(--text-muted); line-height: 1.6; }

/* ---- motion -------------------------------------------------------- */
@media (prefers-reduced-motion: no-preference) {
  .rise { animation: riseIn 480ms var(--ease) both; }
  .cards[data-motion="stagger-reveal"] .card { animation: riseIn 420ms var(--ease) both; }
  .cards[data-motion="stagger-reveal"] .card:nth-child(2) { animation-delay: 70ms; }
  .cards[data-motion="stagger-reveal"] .card:nth-child(3) { animation-delay: 140ms; }
  .cards[data-motion="stagger-reveal"] .card:nth-child(4) { animation-delay: 210ms; }
}
@keyframes riseIn { from { translate: 0 14px; } to { translate: 0 0; } }
@media (prefers-reduced-motion: reduce) {
  .band .bar, .dropzone::before { animation: none !important; }
  * { transition-duration: 0.01ms !important; }
}
.site-footer .footer-group-title { color: #ff99d3; }
/* ---- revision pass: selects, sequenced entrance, column fill -------- */
/* Tool selects as custom controls (preset, export format) */
.panel select {
  appearance: none;
  -webkit-appearance: none;
  background: #4d0519
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23c77aa0' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat right 0.7rem center / 0.65rem 0.5rem;
  border: 1px solid #c77aa0;
  border-radius: 8px;
  color: #ffe6f4;
  font: 500 0.9rem/1.4 inherit;
  padding: 0.55rem 2rem 0.55rem 0.75rem;
  cursor: pointer;
  transition: border-color 140ms var(--ease), background-color 140ms var(--ease);
}
.panel select:hover { border-color: #ff99d3; }
.panel select:active { background-color: #3d0012; }
.panel select:focus-visible { outline: 2px solid #ff99d3; outline-offset: 1px; }
button.primary:active, .btn-primary:active { transform: translateY(1px); }

/* Sequenced entrance: headline → bars → copy → console → cards, ~80ms steps */
.hero-type.rise { animation-delay: 0ms; }
.band-wrap { animation: riseIn 480ms var(--ease) 90ms both; }
.hero-copy.rise { animation-delay: 170ms; }
.console-wrap.rise { animation-delay: 260ms; }
.cards .card { animation: riseIn 420ms var(--ease) both; }
.cards .card:nth-child(1) { animation-delay: 340ms; }
.cards .card:nth-child(2) { animation-delay: 420ms; }
.cards .card:nth-child(3) { animation-delay: 500ms; }
.cards .card:nth-child(4) { animation-delay: 580ms; }
.cards .card:nth-child(5) { animation-delay: 660ms; }
.cards .card:nth-child(6) { animation-delay: 740ms; }

/* Left column fills the row beside the console: copy spreads on the same
 * rhythm, photograph and arc figure settling into the lower space. */
.hero-copy { display: grid; gap: 1.7rem; align-content: space-between; }

@media (prefers-reduced-motion: reduce) {
  .rise, .band-wrap, .cards .card { animation: none !important; }
}
`;
