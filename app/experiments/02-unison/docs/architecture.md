# Architecture — Experiment 02: Unison & Detuning

## Route

`app/experiments/02-unison/page.tsx` — stub page wrapped in `ExperimentShell`
(pending full implementation).

## Planned audio signal chain

```
Tone.Oscillator × N (detuned) → Tone.Panner → Tone.Gain → Tone.Analyser → destination
```

- **Unison voices** — `lib/audio/unison.ts` (planned) manages voice count, detune
  spread, and per-voice pan positions.
- **Gain** — master level after summing voices.
- **Analyser** — shared FFT node; beating and smearing visible on viz.

## State

| State         | Location              | Pattern                |
|---------------|-----------------------|------------------------|
| Audio context | `lib/audio/context.tsx` | audio-context-provider |
| Params        | page local `useState` | param-store            |
| Playing       | context               | audio-context-provider |

## UI layout

`ExperimentShell` chrome inherited from experiment 01.

Planned controls:
- Voice count slider (2–8)
- Detune amount (cents)
- Stereo spread width
- Waveform selector (reused from 01)
- Play/stop toggle

Visualizations (stacked):
- `FFTDisplay` — spectral smearing from detuned partials
- `Spectrograph` — beating visible as amplitude modulation over time

## Shared modules reused

- `lib/viz/FFTDisplay`
- `lib/viz/Spectrograph`
- `lib/ui/ParamSlider`
- `lib/ui/WaveformSelector`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:02-unison` node
- `metadata.json` → `uses` edges to audio/UI components; `prerequisite-of` from 01
- `docs/sources.md` → `source:*` nodes with `cites` edges
