# Architecture — Experiment 03: Pitch Envelopes

## Route

`app/experiments/03-pitch-envelopes/page.tsx` — server page loads lesson; client playground in `PitchEnvelopesPlayground.tsx`.

## Planned audio signal chain

```
Tone.Envelope → osc.frequency (AudioParam)
Tone.Oscillator → Tone.Gain → Tone.Analyser → destination
```

- **Pitch envelope** — `lib/audio/envelope.ts` schedules frequency ramps on trigger.
- **Oscillator** — base frequency set by user; envelope adds offset in Hz or semitones.
- **Analyser** — spectrograph reveals pitch trajectory over time.

## State

| State         | Location              | Pattern                |
|---------------|-----------------------|------------------------|
| Audio context | `lib/audio/context.tsx` | audio-context-provider |
| ADSR params   | page local `useState` | param-store            |
| Playing       | context               | audio-context-provider |

## UI layout

`ExperimentShell` chrome inherited from prior experiments.

Planned controls:
- `EnvelopeEditor` — visual ADSR with draggable breakpoints
- Pitch depth slider (semitones or cents of modulation)
- Base frequency slider
- Play/stop (retriggers envelope on each note-on)

Visualizations:
- `FFTDisplay` — peak position shifts during pitch sweep
- `Spectrograph` — primary diagnostic for pitch envelope shape

## Shared modules reused

- `lib/viz/FFTDisplay`
- `lib/viz/Spectrograph`
- `lib/ui/ParamSlider`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:03-pitch-envelopes` node
- `metadata.json` → `prerequisite-of` chain from 02; `relatedExperiments` → 04
- `docs/sources.md` → cited ADSR and Web Audio envelope references
