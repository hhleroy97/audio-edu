# Architecture — Experiment 06: Layering

## Route

`app/experiments/06-layering/page.tsx` — server page loads lesson;
client playground in `LayeringPlayground.tsx`.

## Audio signal chain

```
Layer 1: Tone.Oscillator → Tone.Filter → Tone.Gain ─┐
Layer 2: Tone.Oscillator → Tone.Filter → Tone.Gain ─┼→ master Gain → FFT Analyser → destination
Layer 3: Tone.Oscillator → Tone.Filter → Tone.Gain ─┘
                                              └→ waveform Analyser (overlay)
```

- **Layer mixer** — `lib/audio/layer-mixer.ts` manages three layers, each with
  independent waveform, frequency offset, gain, and per-layer lowpass cutoff.
- **Analyser** — FFT shows combined spectrum; `WaveformOverlay` shows summed output.

## State

| State        | Location              | Pattern                |
|--------------|-----------------------|------------------------|
| Layer params | page local `useState` | layer-store            |
| Playing      | context               | audio-context-provider |

## UI layout

`ExperimentShell` with `MicroLesson` → playground controls:

- `LayerPanel` × 3 — per-layer waveform, gain, octave offset, cutoff
- Play/stop toggle

Visualizations:
- `WaveformOverlay` — combined output waveform
- `FFTDisplay` — combined spectral content
- `Spectrograph` — full patch evolution over time

## Shared modules reused

Prior experiment modules compose here:

- `lib/audio/layer-mixer`, `lib/audio/filter`, `lib/audio/oscillator`
- `lib/viz/FFTDisplay`, `lib/viz/Spectrograph`, `lib/viz/WaveformOverlay`
- `lib/ui/LayerPanel`, `lib/ui/MicroLesson`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:06-layering` node
- Wikilinks → layering, multi-oscillator, filter, unison
- `metadata.json` → terminal node in Phase-1 arc (`relatedExperiments: []`)
