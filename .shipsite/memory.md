# Site memory

<!-- site-memory/1 -->

What this site's agents (the engineer, its repairs, the designer and the maker) decided and learned, so a mistake fixed once stays fixed.
Every build, repair and design run reads it first. It is your file: edit, add or delete any line, and add sections of your own.
One line per entry: `- date · what — why: reason (from where)`.

## Owner decisions
_(none yet)_

## Never do
- 2026-11-16 · Press Render with no file loaded must answer the tool spec's error "Load an audio file first" (acceptance sample wav-export/render-no-file); only Play preview falls back to the built-in sample. — why: A repair made Render render the built-in sample to answer a QA e2e note about a dead-end first click, and the gate then failed tool-sample wav-export/render-no-file (expected state error). An earlier editor's `git checkout content/slowed-vs-nightcore.json` als (from run_f11b8fcf-40f)

## Product decisions
- 2026-11-16 · Presets are the source of truth: Classic Slowed + Reverb 0.80×/−2 st/55%/+4 dB, Nightcore 1.25×/+4 st/12%/0 dB, Daycore 0.75×/−5 st/40%/+4 dB, set in lib/audio-engine.ts PRESETS and printed on the guide and comparison pa — why: Approved long copy and the compare board quote these numbers; changing a preset must change the copy that cites it. (from run_34ae1546-fa3)

## Open issues
_(none yet)_

## Lessons
- 2026-11-16 · Wide SVG figures (WaveStrip, meters) need preserveAspectRatio="none" and vectorEffect="non-scaling-stroke" on any hairline path; a 9:1 viewBox in a 12:1 box letterboxes and the bars read as a dotted line inset from the t — why: The hero strip rendered inset and dotted for several rounds until the viewBox fit was changed; the stretched tail path also needed non-scaling-stroke to stay a hairline. (from run_c44267f3-082)
- 2026-11-16 · Each slider's visible value is the number input carrying data-tool-input (speed/pitch/reverb-pct/bass-db); there is no .slider-value element. Tests must read the field's inputValue(), never a value span. — why: checks/verify-live.mjs timed out on .slider-value after the slider redesign removed the duplicate value span; the deploy failed even though the tool worked. (from run_34ae1546-fa3)
