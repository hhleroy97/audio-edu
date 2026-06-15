# Synthesis Learning Lab

> Interactive sound-synthesis experiments for RIDDIM / dubstep sound design.
> Make invisible systems visible.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run graph:extract
npm test
```

## Structure

| Path | Purpose |
|------|---------|
| `app/experiments/` | One route per experiment (01–06) |
| `lib/audio/` | Shared synthesis utilities (Tone.js + Web Audio) |
| `lib/viz/` | FFT, spectrograph, waveform renderers |
| `lib/ui/` | Progressive-disclosure UI + agent state indicators |
| `lib/schemas/` | Zod contracts for metadata, graph, tutorials |
| `graph/` | Knowledge-graph index + `.understand/` output |
| `scripts/` | Graph extract + metadata validation |

## Knowledge graph

Adapted from [Understand Anything](https://github.com/Egonex-AI/Understand-Anything):

1. **Deterministic pass** — `npm run graph:extract` parses `experiment.md` frontmatter,
   `metadata.json`, `docs/sources.md` citations, and prerequisite edges.
2. **LLM pass (gated)** — implicit relationships via agents; respects
   `gating.tutorialGeneration` in each experiment's `metadata.json`.

Incremental updates use content fingerprinting — unchanged experiments are skipped
unless `--force` is passed.

## Docs contract (per experiment)

Each experiment includes:

- `experiment.md` — YAML frontmatter + learner-facing theory
- `metadata.json` — agent/backend tags (Zod-validated)
- `docs/theory.md` — grounded concepts with wikilinks
- `docs/architecture.md` — signal chain, state, module wiring
- `docs/sources.md` — cited provenance for every claim
- `docs/changelog.md` — version history

## Phase One arc

1. Oscillator basics (implemented)
2. Unison & detuning (stub)
3. Pitch envelopes (stub)
4. Wavetable modulation (stub)
5. Filtering (stub)
6. Layering (stub)

See [HANDOFF.md](./HANDOFF.md) for full vision.

## Inspiration

Research via GitHits: `mattdesl/workshop-web-audio`, `Tonejs/Tone.js`,
`Egonex-AI/Understand-Anything`, `notthetup/awesome-webaudio`.

Open the inspiration canvas:
[canvases/synthesis-lab-inspiration.canvas.tsx](/home/hartley/.cursor/projects/home-hartley-projects-personal-audio-edu/canvases/synthesis-lab-inspiration.canvas.tsx)
