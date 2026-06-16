# Phase 110 — Mod catalog rotation + rule packs (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 110` after 108  
**Depends on:** Phase 104 (ModFxAgent), Phase 108 (top layer active)  
**Goal:** Exercise ≥6 mod profiles + 3 new archetype rule packs.

---

## Key findings

| Source | Finding | Port |
|--------|---------|------|
| DSF #134 particle-jim | Dual LFO @ half rate on FX | `infekt-constant-motion`, `dual-lfo-fm-drop` |
| DSF #134 Lithium_Hazmat | Allpass 2–5% → comb | `dsf-allpass-comb` on build |
| Catalog §2–§4 | 18 presets, 7 mod profiles | 3 new packs: yoi, tearout, infekt |
| Eval audit | `minUniqueBodyPresets: 1` too weak | Raise to 2 default |

---

## New rule packs (proposed)

- `RIDDIM_YOI_16` — `yoi-talk-wobble` body, formant mod profile
- `RIDDIM_TEAROUT_16` — `tearout-screech-sustain`, `tearout-index-spike`
- `RIDDIM_INFEKT_16` — `infekt-constant-motion`, phaser swell

---

## Full spec

See `docs/research/song-depth-phases-106-111.md` § Phase 110.
