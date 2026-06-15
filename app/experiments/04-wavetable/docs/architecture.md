# Architecture — Experiment 04: Wavetable Modulation

## Route

`app/experiments/04-wavetable/page.tsx` — stub page wrapped in
`ExperimentShell` (pending full implementation).

## Planned audio signal chain

```
PeriodicWave / custom buffer → Tone.Oscillator (type: custom)
  ↑ table position (manual or Envelope-modulated)
Tone.Gain → Tone.Analyser → destination
```

- **Wavetable engine** — `lib/audio/wavetable.ts` (planned) loads frame bank,
  interpolates between frames by position index.
- **Position modulation** — optional `Tone.Envelope` → table position param.
- **Analyser** — FFT shows harmonic shifts as position scrubs.

## State

| State          | Location              | Pattern                |
|----------------|-----------------------|------------------------|
| Audio context  | `lib/audio/context.tsx` | audio-context-provider |
| Table position | page local `useState` | param-store            |
| Frame preview  | derived from position | —                      |

## UI layout

`ExperimentShell` chrome inherited from prior experiments.

Planned controls:
- Table position slider (0–N frames)
- `WavetableDisplay` — visual frame bank with current position marker
- Optional envelope depth for position modulation
- Frequency and amplitude sliders (reused)

Visualizations:
- `FFTDisplay` — harmonic content vs. table position
- `Spectrograph` — timbral evolution when position is modulated

## Shared modules reused

- `lib/viz/FFTDisplay`
- `lib/viz/Spectrograph`
- `lib/ui/ParamSlider`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:04-wavetable` node
- Wikilinks in `theory.md` → graph edges to timbre, morph, envelope
- `metadata.json` → prerequisite chain through 03
