# UI Pass — Readiness Checklist

> Phase-one **functionality** is complete as of **v0.3.0**. The next milestone is
> visual polish and component-system adoption per `HANDOFF.md`.

## Done (v0.3.0)

- [x] Experiments 01–06 interactive with FFT + spectrograph
- [x] Micro-lesson → playground loop (`MicroLesson` + `loadExperimentLesson`)
- [x] Shared audio/viz primitives in `lib/audio` and `lib/viz`
- [x] Deterministic knowledge graph (`npm run graph:extract`)
- [x] Graph watch mode (`npm run graph:watch`)
- [x] Tutorial chunk generator (`npm run tutorials:generate` → `graph/tutorials/chunks.json`)
- [x] Vitest + production build passing

## UI pass scope (next)

1. **shadcn/ui init** — replace ad-hoc controls with shared primitives (Button, Slider, Card, Collapsible)
2. **Magic UI accents** — minimal motion/flair on lesson transitions and agent-state indicators
3. **Brand palette** — deep dark purple base, hot red (working), arctic blue (idle/done)
4. **Progressive disclosure** — optional cumulative control stack across experiments (currently per-page shells)
5. **Graph viewer** — upgrade `/graph` from flat list to interactive layout (post-shadcn)
6. **Home / experiment index** — navigation polish, experiment cards with status badges

## Deferred (post–UI pass)

- LLM implicit-edge graph pass
- Three.js harmonic visualizations (Phase-1 stretch)
- Tutorial publish pipeline (human-review gate enforcement)

## Verify before UI pass

```bash
npm test
npm run build
npm run graph:extract
npm run tutorials:generate
```

Start dev server: `npm run dev` → visit `/experiments/01-oscillator` through `/06-layering`.
