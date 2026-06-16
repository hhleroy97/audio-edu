# PROJECT — Synthesis Learning Lab

## Vision

Web-based sound-synthesis learning lab with Patch Lab node-graph canvas, grounded in
RIDDIM/dubstep pedagogy and Zod-validated contracts (`AGENTS.md`, `HANDOFF.md`).

## Current milestone: Arrangement agents & song UI (87–93)

**Goal:** Procedural song generation from **rule packs** via a **supervisor arrangement agent** with specialist sub-agents (pattern, drum, automation, mix). Full arrangement UI in Patch Lab — generate, preview, further modulate via automation agent.

**Previous milestone (shipped):** Multibus riddim songs (81–86) + mix agent phase 2 + drums/sidechain phase 3.

**Baseline:** SongDef v2, multibus engine, riddim templates, mix pass, procedural drums, PatchSongPanel.

**Gap (this milestone):**
- Templates are hand-authored — no rule-pack generation UI
- No pluggable MIDI/pattern generator (`tonal` integration pending)
- Automation is embedded in arrangement builder — not a separable sub-agent contract
- No supervisor orchestration or sub-agent progress in UI

## Constraints

- Web Audio API first; no Tone.js runtime dependency
- Strudel-inspired **IR port only** (stack/cat/slow) — no AGPL embed without review
- **`tonal` (MIT)** approved for phase 88 pattern generation
- Every schema change → Zod + lint before write
- Docs + tests per phase; atomic commits
- Sub-agents follow mix-pass shape: propose → lint → merge → gate

## Canonical refs

- `docs/research/arrangement-agent-landscape.md` — **new** GitHits + agent hierarchy
- `docs/research/multibus-song-engine-landscape.md`
- `docs/research/procedural-music-landscape.md`
- `docs/research/riddim-sound-catalog.md`
- `.planning/phases/87-arrangement-agent-ui/RESEARCH.md`
- `UI_OVERHAUL_HANDOFF.md`
