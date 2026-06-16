# Phase 107 — MelodicPhraseAgent (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 107` after 106  
**Depends on:** Phase 106 (chord roots), Phase 101 (pocket)  
**Goal:** Humanized bass motion — chops, octave jumps, micro-timing.

---

## Key findings

| Source | Finding | Port |
|--------|---------|------|
| DSF #134 `_ronzlo` | **Turn off quantize** on basslines | `MelodyDef.microTimingMs` |
| Sample Focus #127 | Velocity + bar-relative timing evolution | Extend groove velocity jitter |
| Melodic dubstep #136 | **Hocket** — alternate melody/bass between instruments | `hocketAlternate` on body/sub |
| DSF #134 | 32-bar repetition boredom | `chopEveryBars: 2` mutates pattern |

---

## Agent placement

Post-`PatternAgent`, pre-`TransitionAgent` — mutates `section.events` note midis/timing.

---

## Eval extensions

- `minDistinctBodyMidis ≥ 3` per drop
- `microTimingSpreadMs > 0`

---

## Full spec

See `docs/research/song-depth-phases-106-111.md` § Phase 107.
