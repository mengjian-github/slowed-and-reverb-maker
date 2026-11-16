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
- 2026-11-16 · QA's jtbd-e2e "tool-default-input-error (wav-export)" fights the tool sample render-no-file: Render with no file must stay in error with "Load an audio file first". The compromise kept in Studio is: keep the error state, — why: Both keyed to the same Render press; making Render succeed failed the acceptance sample (see Never do), so do not switch it to success without a plan change. (from run_ff7d1571-08d)
- 2026-11-16 · QA keeps finding: route-1:jtbd-e2e-failed:tool-spec,tool-spec,tool-spec:wav-export:tool-default-input-error:wav-export:the example the tool opens with (speed, pitch, reverb-pct) ends in an error on the first click; make  — why: it blocked 2 QA rounds; fix its cause, and check an earlier fix did not bring it back [seen 3×] (from run_f11b8fcf-40f-infra-qa)
- 2026-11-16 · QA keeps finding: jtbd-e2e:no-tool-route-completed-a-real-browser-action — why: it blocked 2 QA rounds; fix its cause, and check an earlier fix did not bring it back [seen 2×] (from run_f11b8fcf-40f-infra-qa)
- 2026-11-16 · QA keeps finding: demand:unverified:repair-measured-task-failures-before-review — why: it blocked 2 QA rounds; fix its cause, and check an earlier fix did not bring it back [seen 2×] (from run_f11b8fcf-40f-infra-qa)
- 2026-11-16 · QA keeps finding: route-1:tool-state-unseen:eyes same — 1 | 4 | working or playing after the main button is pressed is not distinct from arrival; the drop zone, both buttons, and the line under them are unchanged (QA mea — why: it blocked 2 QA rounds; fix its cause, and check an earlier fix did not bring it back [seen 2×] (from run_f11b8fcf-40f-infra-qa)
- 2026-11-16 · QA keeps finding: route-2:tool-state-unseen:eyes same — 4 | 1 | working or playing after Apply shape should appear, but the drop zone still says Drop a song here and the footer is unchanged (QA measured this press as sti — why: it blocked 2 QA rounds; fix its cause, and check an earlier fix did not bring it back [seen 2×] (from run_f11b8fcf-40f-infra-qa)

## Lessons
- 2026-11-16 · WAV export sample rate: decodeAudioData resamples to the browser AudioContext rate (44.1/48 kHz), so encodeWav writes that rate — copy must say "your browser's audio sample rate", never "the source file's sample rate". — why: QA measured an 8 kHz source exporting as 44.1 kHz; lib/audio-engine.ts decodeFile uses new AudioContext() and renderOffline sizes the OfflineAudioContext at source.buffer.sampleRate, which is the device rate. (from run_ff7d1571-08d)
- 2026-11-16 · Wide SVG figures (WaveStrip, meters) need preserveAspectRatio="none" and vectorEffect="non-scaling-stroke" on any hairline path; a 9:1 viewBox in a 12:1 box letterboxes and the bars read as a dotted line inset from the t — why: The hero strip rendered inset and dotted for several rounds until the viewBox fit was changed; the stretched tail path also needed non-scaling-stroke to stay a hairline. (from run_c44267f3-082)
- 2026-11-16 · Each slider's visible value is the number input carrying data-tool-input (speed/pitch/reverb-pct/bass-db); there is no .slider-value element. Tests must read the field's inputValue(), never a value span. — why: checks/verify-live.mjs timed out on .slider-value after the slider redesign removed the duplicate value span; the deploy failed even though the tool worked. (from run_34ae1546-fa3)
