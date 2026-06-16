# PROJECT — Synthesis Learning Lab

## Vision

Web-based sound-synthesis learning lab with Patch Lab node-graph canvas, grounded in
RIDDIM/dubstep pedagogy and Zod-validated contracts (`AGENTS.md`, `HANDOFF.md`).

## Current milestone: Pro modulation parity

**Goal:** Patch Lab modulation infrastructure matches what Serum/Vital producers expect for
riddim bass design — bipolar routing, live feedback, multi-LFO density, macro control, and
reference presets that sound "finished" on headphones.

**Baseline (shipped):** Waves A–C in `docs/research/riddim-feature-roadmap.md` — FM, distortion,
tempo LFO, layer stack, formants, mod matrix (unipolar depth only), custom LFO curves, etc.

**Gap (this milestone):** Mod matrix lacks bipolar/attenuverter semantics, no live mod preview,
no macro fan-out, LFO shapes missing S&H/key-track, P3 workflow (resample, grid, descriptors).

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
- arXiv:2510.06204 (mod discovery), synflow mod-matrix pattern, audio-nodes live mod preview
