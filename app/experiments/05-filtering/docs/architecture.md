# Architecture — Experiment 05: Filtering

## Route

`app/experiments/05-filtering/page.tsx` — server page loads lesson;
client playground in `FilteringPlayground.tsx`.

## Audio signal chain

```
Tone.Oscillator (rich waveform) → Tone.Filter (lowpass) → Tone.Gain → Tone.Analyser → destination
```

- **Filter** — `lib/audio/filter.ts` wraps `Tone.Filter` with cutoff and Q params.
- **Source** — user-selectable waveform (saw default for rich harmonics).
- **Analyser** — FFT shows real-time harmonic removal.

## State

| State     | Location              | Pattern                |
|-----------|-----------------------|------------------------|
| Cutoff    | page local `useState` | param-store            |
| Resonance | page local `useState` | param-store            |
| Waveform  | page local `useState` | param-store            |
| Playing   | context               | audio-context-provider |

## UI layout

`ExperimentShell` with `MicroLesson` → playground controls:

- Cutoff frequency slider (20 Hz – 20 kHz, log scale)
- Resonance (Q) slider
- `WaveformSelector` for source timbre
- Play/stop toggle

Visualizations:
- `FilterResponseDisplay` — magnitude response curve vs. cutoff/Q
- `FFTDisplay` — peaks vanish above cutoff
- `Spectrograph` — cutoff sweeps visible as brightness rolloff

## Shared modules reused

- `lib/viz/FFTDisplay`, `lib/viz/Spectrograph`, `lib/viz/FilterResponseDisplay`
- `lib/ui/ParamSlider`, `lib/ui/WaveformSelector`, `lib/ui/MicroLesson`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:05-filtering` node
- Wikilinks → filter, cutoff, resonance concept nodes
- `metadata.json` → prerequisite chain through 04; related to 06
