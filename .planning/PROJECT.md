# PROJECT — Synthesis Learning Lab

## Vision

Web-based sound-synthesis learning lab with Patch Lab node-graph canvas, grounded in
RIDDIM/dubstep pedagogy and Zod-validated contracts (`AGENTS.md`, `HANDOFF.md`).

## Current milestone: Chords, polyphony & timbre intelligence (116–121)

**Goal:** Polyphonic layer voices so body can play dyads/triads; synthesis-grounded timbre
scoring across the archetype catalog; beat-aware automation per phrase slot; eval gates for
chord density.

**Previous milestone (112–115, local):** Pitch tracking, harmony-locked sub, synth send FX.

**Previous milestone (shipped):** Song depth & musical richness (106–111).

**Baseline:** Multibus engine, ChordVoicingAgent bar slots, synth sends, 5+ rule packs.

**Gap (this milestone):**
- `LayerEngine` is monophonic — chord plans never audible
- `PatternAgent` picks one degree per hit despite `bodyDegrees[]`
- `TimbreAgent` uses static preset map — 18 archetypes underused
- Automation is section-global — phrase slots don't tune synth macros

## Previous milestone: Arrangement agents & song UI (87–93)

## Constraints

- Web Audio API first; no Tone.js runtime dependency
- Strudel-inspired **IR port only** (stack/cat/slow) — no AGPL embed without review
- **`tonal` (MIT)** approved for phase 88 pattern generation
- Every schema change → Zod + lint before write
- Docs + tests per phase; atomic commits
- Sub-agents follow mix-pass shape: propose → lint → merge → gate

## Canonical refs

- `docs/research/chords-polyphony-milestone-116-121.md` — **active** polyphony + timbre plan
- `docs/theory/layer-energy-model.md` — layer spectrum / energy model
- `docs/research/audio-fidelity-milestone-112-115.md` — pitch + FX (112–114)
- `docs/research/arrangement-agent-landscape.md` — GitHits + agent hierarchy
- `docs/research/multibus-song-engine-landscape.md`
- `docs/research/procedural-music-landscape.md`
- `docs/research/riddim-sound-catalog.md`
- `.planning/phases/87-arrangement-agent-ui/RESEARCH.md`
- `UI_OVERHAUL_HANDOFF.md`
