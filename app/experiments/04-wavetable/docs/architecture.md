# Architecture — Experiment 04: Wavetable Modulation

## Route

`app/experiments/04-wavetable/page.tsx` — server page loads lesson;
client playground in `WavetablePlayground.tsx`.

## Audio signal chain

```
Tone.Oscillator (sine) ─┐
                         ├→ crossfade Gain nodes → Tone.Gain → Tone.Analyser → destination
Tone.Oscillator (saw) ─┘
```

- **Wavetable engine** — `lib/audio/wavetable.ts` crossfades two oscillators by
  morph position (0 = sine, 1 = saw).
- **Analyser** — FFT shows harmonic shifts as position scrubs.

## State

| State          | Location              | Pattern                |
|----------------|-----------------------|------------------------|
| Audio context  | `lib/audio/context.tsx` | audio-context-provider |
| Table position | page local `useState` | param-store            |
| Frequency/gain | page local `useState` | param-store            |

## UI layout

`ExperimentShell` with `MicroLesson` → playground controls:

- Table position slider (0–1 morph)
- Frequency and amplitude sliders
- Play/stop toggle

Visualizations:
- `WavetableDisplay` — morph preview with current position marker
- `FFTDisplay` — harmonic content vs. table position
- `Spectrograph` — timbral evolution when position changes

## Shared modules reused

- `lib/viz/FFTDisplay`, `lib/viz/Spectrograph`, `lib/viz/WavetableDisplay`
- `lib/ui/ParamSlider`, `lib/ui/MicroLesson`

## Knowledge-graph hooks

- `experiment.md` frontmatter → `experiment:04-wavetable` node
- Wikilinks in `theory.md` → graph edges to timbre, morph, envelope
- `metadata.json` → prerequisite chain through 03
