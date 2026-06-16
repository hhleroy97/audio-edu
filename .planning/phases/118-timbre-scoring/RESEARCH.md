# Phase 118 — Timbre scoring agent (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 118`  
**Depends on:** 103 (TimbreAgent), riddim-archetypes catalog  
**Goal:** Synthesis-grounded preset picks — variety without random noise.

---

## Problem

`DEFAULT_TIMBRE.bySectionKind` hardcodes 6 preset ids. Catalog has 18+ archetypes with
`techniqueTags` but no agent uses them for selection.

## Deliverables

1. `lib/schemas/preset-archetype-meta.ts` — Zod schema for band/motion/richness
2. `lib/patch/presets/archetype-meta.ts` — metadata for all `RIDDIM_ARCHETYPE_*` presets
3. `lib/song/agents/timbre-scoring-agent.ts` — deterministic score + pick
4. Wire into `runTimbreAgent` or post-step before merge

## Scoring axes (deterministic)

| Axis | Source |
|------|--------|
| spectralBand | catalog section + signal flow |
| motionClass | LFO count, dual-lfo tags |
| harmonicRichness | FM/detune/unison tags |
| sectionKind | intro=static, drop=motion |
| diversity | penalize reuse across sections |

## Eval

- Raise `minUniqueBodyPresets` to 4 on standard pack
- `minArchetypePresetsUsed ≥ 4` across song

## Verification

- [ ] Same seed → same preset picks
- [ ] Different packs → different archetype families (yoi vs tearout)

**Parent:** `docs/research/chords-polyphony-milestone-116-121.md`
