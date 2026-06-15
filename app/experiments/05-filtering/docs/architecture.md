# Architecture — Experiment 05: Filtering

## Route

`app/experiments/05-filtering/page.tsx` — stub page wrapped in
`ExperimentShell` (pending full implementation).

## Planned audio signal chain

```
Tone.Oscillator (rich waveform) → Tone.Filter (lowpass) → Tone.Gain → Tone.Analyser → destination
```

- **Filter** — `lib/audio/filter.ts` (planned) wraps `Tone.Filter` with cutoff
  and Q (resonance) params.
- **Source** — saw or wavetable for harmonically rich input.
- **Analyser** — FFT shows real-time harmonic removal.

## State

| State    | Location              | Pattern                |
|----------|-----------------------|------------------------|
| Cutoff   | page local `useState` | param-store            |
| Resonance| page local `useState` | param-store            |
| Playing  | context               | audio-context-provider |

## UI layout

`ExperimentShell` chrome inherited from prior experiments.

Planned controls:
- Cutoff frequency slider (20 Hz – 20 kHz, log scale)
- Resonance (Q) slider
- Source waveform selector (reused)
- `FilterResponseDisplay` — visual magnitude response curve

Visualizations:
- `FFTDisplay` — primary diagnostic; peaks vanish above cutoff
- `Spectrograph` — cutoff sweeps visible as brightness rolloff

## Shared modules reused

- `lib/viz/FFTDisplay`
- `lib/viz/Spectrograph`
- `lib/ui/ParamSlider`
- `lib/ui/WaveformSelector`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:05-filtering` node
- Wikilinks → filter, cutoff, resonance concept nodes
- `metadata.json` → prerequisite chain through 04; related to 06
