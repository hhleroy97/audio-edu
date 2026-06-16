# PROJECT — Synthesis Learning Lab

## Vision

Web-based sound-synthesis learning lab with Patch Lab node-graph canvas, grounded in
RIDDIM/dubstep pedagogy and Zod-validated contracts (`AGENTS.md`, `HANDOFF.md`).

## Current milestone: Procedural song generation

**Goal:** Pre-generate full riddim songs — arrangement (pattern/time) + timbre (Patch Lab presets) → reproducible WAV + manifest.

**Previous milestone (shipped):** Pro modulation parity (phases 71–75) + riddim archetype catalog (cycle 4).

**Baseline:** 35 Patch Lab presets, transport grid, resample→sampler, Zod contracts, knowledge graph.

**Gap (this milestone):** No song-level schema, no pattern scheduler, no offline render pipeline, no Strudel/Tidal-inspired arrangement layer.

## Constraints

- Web Audio API first; WASM only if profiling proves need
- Every schema change → Zod validate before write
- Docs + tests alongside each phase; atomic commits per phase
- Sources in `docs/research/sources.md`; graph updates in `graph/research/`

## Canonical refs

- `docs/research/riddim-feature-roadmap.md`
- `docs/research/riddim-synthesis.md`
- `docs/research/pro-modulation-plan.md`
- `UI_OVERHAUL_HANDOFF.md`
- `docs/research/procedural-music-landscape.md`
- `docs/research/riddim-sound-catalog.md`
