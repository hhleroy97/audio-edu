# Phase 108 — Section timbre runtime (research)

**Status:** Shipped · **Next:** phase 106 harmony v2  
**Depends on:** Phase 103 (TimbreAgent plans)  
**Goal:** Section boundaries emit `layerPreset` / `layerGain` from `SectionTimbrePlan[]`.

---

## Key findings

| Source | Finding | Port |
|--------|---------|------|
| Preset Drive #135 | Sub/body/top **frequency slotting** | Per-section preset + gain |
| Producer Hive #139 | 4-layer stack leveling | Section `layerGain` ramps |
| Code audit | `timbreResult.layers` = drop-a only | Emit events at `section.startBar` |

---

## Implementation sketch

1. `TimbreRuntimeAgent` maps `plans` → `layerPreset` events at section beat 0
2. Fix `layersForSection` to use `bySectionKind.top`
3. `compile-schedule` already supports `layerPreset` — no scheduler change

---

## Eval

`minSectionPresetSwaps ≥ 3` per 16-bar song.

---

## Full spec

See `docs/research/song-depth-phases-106-111.md` § Phase 108.
