# Architecture — Experiment 02: Unison & Detuning

## Route

`app/experiments/02-unison/page.tsx` — client component wrapped in `AudioLabProvider`.

## Audio signal chain

```
Tone.Oscillator × N (detuned) → Tone.Panner → Tone.Gain → Tone.Analyser (fft) → destination
                                                          → Tone.Analyser (waveform)
```

- **Unison voices** — `lib/audio/unison.ts` manages voice count, detune spread, pan positions.
- **Gain** — master level after summing voices.
- **FFT analyser** — shared from `AudioLabProvider`; spectral smearing visible.
- **Waveform analyser** — parallel tap for `WaveformOverlay`.

## State

| State         | Location              | Pattern                |
|---------------|-----------------------|------------------------|
| Audio context | `lib/audio/context.tsx` | audio-context-provider |
| Params        | page local `useState` | param-store            |
| Playing       | context               | audio-context-provider |

## UI layout

`ExperimentShell` chrome inherited from experiment 01, with additional controls:

- Voice count (1–8)
- Detune amount (cents)
- Stereo spread
- Waveform selector, frequency, amplitude (reused from 01)

Visualizations:
- `WaveformOverlay` — summed waveform of detuned stack
- `FFTDisplay` — smeared harmonics
- `Spectrograph` — beating as amplitude modulation over time

## Shared modules

- `lib/audio/unison.ts` (new)
- `lib/viz/WaveformOverlay` (new)
- Reused: `FFTDisplay`, `Spectrograph`, `ParamSlider`, `WaveformSelector`
