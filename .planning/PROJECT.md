# PROJECT — Synthesis Learning Lab

## Vision

Web-based sound-synthesis learning lab with Patch Lab node-graph canvas, grounded in
RIDDIM/dubstep pedagogy and Zod-validated contracts (`AGENTS.md`, `HANDOFF.md`).

## Current milestone: Multibus riddim songs (81–86)

**Goal:** Parallel layer buses (sub + body + optional top) with audio-clock scheduling and **arranged** riddim songs — intro / drop / break / drop swap — not single-preset hot-swap.

**Previous milestone (shipped):** Procedural songs v1 (76–80) — SongDef IR, MVP scheduler, templates, lesson 08.

**Baseline:** 35 presets, archetype catalog, `lib/song/*` pipeline, Patch Lab mixer node, generator restart fixes.

**Gap (this milestone):**
- Song mode replaces entire graph per note (`loadPreset`) — no true layering
- `setTimeout` scheduler drifts; global gate timer collides on overlapping notes
- Templates are repetitive halftime grids — no section arrangement or `cat` variation
- Offline render is placeholder sine, not multibus stems

## Constraints

- Web Audio API first; no Tone.js runtime dependency
- Strudel-inspired **IR port only** (stack/cat/slow) — no AGPL embed without review
- Every schema change → Zod + lint before write
- Docs + tests per phase; atomic commits
- Sub layer protection rules from catalog (#19, #48)

## Canonical refs

- `docs/research/multibus-song-engine-landscape.md` — **new** GitHits research
- `docs/research/procedural-music-landscape.md`
- `docs/research/riddim-sound-catalog.md`
- `.planning/phases/81-multibus-riddim-songs/PLAN.md`
- `UI_OVERHAUL_HANDOFF.md`
