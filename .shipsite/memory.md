# Site memory

<!-- site-memory/1 -->

What this site's agents (the engineer, its repairs, the designer and the maker) decided and learned, so a mistake fixed once stays fixed.
Every build, repair and design run reads it first. It is your file: edit, add or delete any line, and add sections of your own.
One line per entry: `- date · what — why: reason (from where)`.

## Owner decisions
_(none yet)_

## Never do
_(none yet)_

## Product decisions
- 2026-11-16 · Presets are the source of truth: Classic Slowed + Reverb 0.80×/−2 st/55%/+4 dB, Nightcore 1.25×/+4 st/12%/0 dB, Daycore 0.75×/−5 st/40%/+4 dB, set in lib/audio-engine.ts PRESETS and printed on the guide and comparison pa — why: Approved long copy and the compare board quote these numbers; changing a preset must change the copy that cites it. (from run_34ae1546-fa3)

## Open issues
_(none yet)_

## Lessons
- 2026-11-16 · Each slider's visible value is the number input carrying data-tool-input (speed/pitch/reverb-pct/bass-db); there is no .slider-value element. Tests must read the field's inputValue(), never a value span. — why: checks/verify-live.mjs timed out on .slider-value after the slider redesign removed the duplicate value span; the deploy failed even though the tool worked. (from run_34ae1546-fa3)
