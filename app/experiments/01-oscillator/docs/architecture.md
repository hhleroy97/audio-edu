# Architecture — Experiment 01: Oscillator Basics

## Route

`app/experiments/01-oscillator/page.tsx` — client component wrapped in
`AudioLabProvider`.

## Audio signal chain

```
Tone.Oscillator → Tone.Gain → Tone.Analyser (fft) → destination
```

- **Oscillator** — `lib/audio/oscillator.ts` creates and updates the chain.
- **Gain** — amplitude control; keeps headroom before analyser tap.
- **Analyser** — shared FFT node from `AudioLabProvider`; feeds both viz components.

## State

| State        | Location              | Pattern              |
|--------------|-----------------------|----------------------|
| Audio context| `lib/audio/context.tsx` | audio-context-provider |
| Params       | page local `useState` | param-store          |
| Playing      | context               | audio-context-provider |

## UI layout

`ExperimentShell` provides progressive-disclosure chrome reused in experiments 02–06.

Controls (left column):
- `WaveformSelector` — four standard shapes
- `ParamSlider` × 2 — frequency, amplitude
- Play/stop toggle (user-gesture gated via `Tone.start()`)

Visualizations (stacked):
- `FFTDisplay` — bar chart of current spectrum
- `Spectrograph` — scrolling time-frequency heatmap

## Shared modules introduced

These become dependencies for all subsequent experiments:

- `lib/viz/FFTDisplay`
- `lib/viz/Spectrograph`
- `lib/ui/ParamSlider`
- `lib/ui/WaveformSelector`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:01-oscillator` node
- `metadata.json` → `uses` edges to audio/UI components
- `docs/sources.md` → `source:*` nodes with `cites` edges
