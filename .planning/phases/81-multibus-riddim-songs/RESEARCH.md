# Phase 81 — Multibus riddim songs (research)

**Status:** Research complete · **Next:** execute PLAN.md phases 82–86  
**Depends on:** Phases 77–80 (SongDef, scheduler MVP, templates)  
**Goal:** GitHits-backed architecture for parallel layer buses + varied riddim arrangements.

---

## Research questions

1. Which OSS projects implement **multibus / multitrack** scheduling in the browser?
2. How do live-coding tools express **stacked layers** and **section variation**?
3. What can we reuse from Patch Lab without new npm deps?
4. What SongDef v2 fields are required for real riddim (intro/drop/break)?
5. What is the minimal multibus vertical slice?

---

## GitHits findings

| Query | Solution ID | Takeaway |
|-------|-------------|----------|
| Web Audio ChannelMerger multibus | `355afbb7` | Per-bus GainNode + schedule at `currentTime` |
| Tone.js Transport Channel send | `d0296a62` | Part channels + effect buses + loop scheduling |
| Strudel stack/cat/slow | `600680ce` | Combinator semantics for IR port |
| Parallel layer patch lab | `3c31252a` | Named layers → master mixBus Map |

**Tone.js npm search:** backend unavailable at research time — README example sufficient.  
**Strudel repo code index:** still indexing; combinators validated via distilled example.

---

## Architecture recommendation

**Native Web Audio multibus + N lightweight layer engines** (not Tone.js embed, not SuperCollider).

Each `SongLayer`:
- Loads preset once → dedicated `AudioEngine` subgraph (or shared engine with isolated output tap)
- Routes to `MasterBus` with per-layer gain/mute
- Receives note/gate events on **layer id**, never `loadPreset()` mid-song

Scheduler:
- `t0 = ctx.currentTime + 0.1` lookahead
- Events as `{ layerId, beat, kind }` scheduled on audio thread
- Per-layer ADSR via existing envelope `triggerGate`

---

## Vertical slice (MVP multibus song)

**16 bars @ 140 BPM**, structure:

```
intro (4) → dropA (4) → break (4) → dropB (4)
```

Layers:
- `sub` → `clean-sub` (root F#1, no mod)
- `body` → `hydraulic-press-wobble` / `harsh-square-fm` (cat swap at dropB)
- optional `top` → muted in intro/break

Drums: MVP synth clicks or `/public/samples/riddim/` one-shots (phase 84).

---

## Open decisions (defaults chosen)

| # | Question | Default |
|---|----------|---------|
| 1 | Max live layers | 3 (sub, body, top) |
| 2 | One AudioContext vs N | **One ctx**, N subgraph roots → master bus |
| 3 | UI graph during song play | Read-only / ghost; layer engines off-DOM |
| 4 | Pattern combinators in v2 | `stack`, `cat`, `slow` only |
| 5 | Drum implementation | Sample triggers first; synth kick fallback |

---

## Verification (research)

- [x] ≥4 GitHits/OSS patterns documented with solution IDs
- [x] Mapping to existing Patch Lab mixer + presets
- [x] `docs/research/multibus-song-engine-landscape.md` written
- [x] Risks + MVP scope stated
- [x] Phases 82–86 broken down in PLAN.md

---

## Sources

See `docs/research/sources.md` #89–95.
