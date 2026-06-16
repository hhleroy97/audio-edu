# Phase 109 — Sample playback + drum sends (research)

**Status:** Shipped · **Next:** phase 108 section timbre runtime  
**Depends on:** Phase 102 (sample registry)  
**Goal:** Audible WAV drums + snare reverb/delay send in multibus playback.

---

## Key findings

| Source | Finding | Port |
|--------|---------|------|
| #107 Web Audio | `AudioBufferSourceNode.start(when)` | Already in DrumEngine |
| #132 Tone Player | Layered sample hits | `loadAllDrumSamples` in PatchSongPanel |
| #133 Convolver | Snare send reverb | `DrumEngine` send bus |
| Code audit | `sendFx` schema only | Wire `MasterBus` or drum aux |

---

## Deliverables

1. `PatchSongPanel.play()` → `await loadAllDrumSamples(ctx, engine.drumEngine)`
2. Offline render path same hook
3. `SendBus` with procedural IR or short noise impulse
4. ModFxAgent: per-section send levels as automation (not global max)

---

## Eval

`sampleHitRatio ≥ 0.8` when `requireSamples: true`.

---

## Full spec

See `docs/research/song-depth-phases-106-111.md` § Phase 109.
