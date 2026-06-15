# Architecture — Experiment 03: Pitch Envelopes

## Route

`app/experiments/03-pitch-envelopes/page.tsx` — server page loads lesson via
`loadExperimentLesson`; client playground in `PitchEnvelopesPlayground.tsx`.

## Audio signal chain

```
Tone.Envelope → osc.frequency (AudioParam)
Tone.Oscillator → Tone.Gain → Tone.Analyser → destination
```

- **Pitch envelope** — `lib/audio/envelope.ts` schedules frequency ramps on trigger.
- **Oscillator** — base frequency from user; envelope adds offset in semitones.
- **Analyser** — spectrograph reveals pitch trajectory over time.

## State

| State         | Location              | Pattern                |
|---------------|-----------------------|------------------------|
| Audio context | `lib/audio/context.tsx` | audio-context-provider |
| ADSR params   | page local `useState` | param-store            |
| Playing       | context               | audio-context-provider |

## UI layout

`ExperimentShell` with `MicroLesson` → playground controls:

- `EnvelopeEditor` — ADSR sliders with `EnvelopeCurve` preview
- Pitch depth slider (semitones of modulation)
- Base frequency slider
- Play/stop (retriggers envelope on each note-on)

Visualizations:
- `FFTDisplay` — peak position shifts during pitch sweep
- `Spectrograph` — primary diagnostic for pitch envelope shape

## Shared modules reused

- `lib/viz/FFTDisplay`, `lib/viz/Spectrograph`, `lib/viz/EnvelopeCurve`
- `lib/ui/ParamSlider`, `lib/ui/EnvelopeEditor`, `lib/ui/MicroLesson`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:03-pitch-envelopes` node
- `metadata.json` → `prerequisite-of` chain from 02; `relatedExperiments` → 04
- `docs/sources.md` → cited ADSR and Web Audio envelope references
