# UI Pass — Readiness Checklist

> **v0.4.0** introduces the **Patch Lab** (`/lab`) — node-graph canvas per `UI_OVERHAUL_HANDOFF.md`.
> Legacy experiment pages remain at `/experiments/*` during transition.

## Done (v0.4.0)

- [x] React Flow canvas + zustand store (xyflow tutorial pattern)
- [x] AudioEngine reconciler with connection registry + cycle validation
- [x] Oscillator, Output, Analyser tap nodes with typed audio ports
- [x] Analysis column: oscilloscope, FFT spectrum, spectrogram with labeled axes
- [x] Lesson 01 guided flow (react-joyride + step overlay)
- [x] Patch Zod contracts (`Patch`, `Lesson`, `TourStep`)

## Next (UI polish)

1. **shadcn/ui init** — toolbar, palette, stepper components
2. **Remaining node catalog** — Filter, Envelope, Wavetable, Unison, Mixer, LFO
3. **CV/trigger ports** — modulation patching into `AudioParam`s
4. **Persistence** — save/load `Patch` JSON
5. **Lessons 02–06** — progressive node unlock
6. **Responsive** — analysis column → bottom drawer on narrow viewports

## Deferred

- audiomotion-analyzer integration (hand-rolled spectrum first)
- LLM implicit-edge graph pass
- Three.js harmonic visualizations

## Verify

```bash
npm test
npm run build
npm run dev   # → http://localhost:3000/lab
```
