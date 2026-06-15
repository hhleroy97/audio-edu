# Architecture — Experiment 06: Layering

## Route

`app/experiments/06-layering/page.tsx` — stub page wrapped in
`ExperimentShell` (pending full implementation).

## Planned audio signal chain

```
Layer 1: Tone.Oscillator → Tone.Gain ─┐
Layer 2: Tone.Oscillator → Tone.Gain ─┼→ Tone.Filter → Tone.Gain → Tone.Analyser → destination
Layer 3: Tone.Oscillator → Tone.Gain ─┘
```

- **Layer mixer** — `lib/audio/layer-mixer.ts` (planned) manages N layers, each
  with independent waveform, frequency offset, level, and mute/solo.
- **Shared filter** — `lib/audio/filter.ts` from experiment 05 on the sum bus.
- **Analyser** — FFT shows combined spectrum; solo buttons isolate layer contribution.

## State

| State       | Location              | Pattern                |
|-------------|-----------------------|------------------------|
| Layer params| page local / store    | layer-store            |
| Filter params| page local `useState`| param-store            |
| Playing     | context               | audio-context-provider |

## UI layout

`ExperimentShell` chrome inherited from prior experiments.

Planned controls:
- `LayerPanel` × 3 — per-layer waveform, level, octave offset, mute/solo
- Shared filter cutoff + resonance (reused from 05)
- Master level slider
- Play/stop toggle

Visualizations:
- `FFTDisplay` — combined + per-layer spectral contribution (solo mode)
- `Spectrograph` — full patch evolution over time

## Shared modules reused

All prior experiment modules compose here:

- `lib/audio/oscillator`, `lib/audio/unison`, `lib/audio/filter`, `lib/audio/gain`
- `lib/viz/FFTDisplay`, `lib/viz/Spectrograph`
- `lib/ui/ParamSlider`, `lib/ui/WaveformSelector`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:06-layering` node
- Wikilinks → layering, multi-oscillator, filter, unison
- `metadata.json` → terminal node in Phase-1 arc (`relatedExperiments: []`)
