# Song drums + sidechain — phase 3 research

> **Research cycle 7** (2026-06-16): GitHits pass on Web Audio drum scheduling + gain-duck sidechain.  
> Implements procedural drum lane + kick→bass ducking on top of phase-2 mix agent (#105).

---

## Goal

Close the largest “not a track yet” gap:

```
SongDef.drums → compile drumHit actions → DrumEngine (procedural) → preMaster
kick hit → SidechainDucker → duckGain on sub/body layers
```

---

## GitHits evidence

| Source | Finding | Port |
|--------|---------|------|
| Web Audio `AudioBufferSourceNode.start(when)` (#107) | Sample-accurate scheduling on audio clock | `DrumEngine.scheduleHit(atTime)` |
| Web Audio `AudioParam` automation (#96) | `linearRampToValueAtTime` for envelopes | Kick pitch sweep + sidechain duck |
| Tone.js `Param` automation (#108) | Same pattern as native Gain automation | `MasterBus.scheduleSidechainDuck` |
| Riddim halftime pocket (#56, #91) | 140 BPM kick on beats 1 & 3 (0-indexed 0, 2) | `buildRiddimDrumGrid` |
| Sidechain ducking (#61, #118) | ~80–120 ms release, 30–40% depth on bass | `SidechainDef` defaults |

**Note:** Standard Web Audio `DynamicsCompressorNode` has no external sidechain input — ducking is implemented via a dedicated `duckGain` stage per layer fader, not compressor sidechain.

---

## Schema (`lib/schemas/drums.ts`)

| Type | Role |
|------|------|
| `SidechainDef` | depth, attackSec, releaseSec, targetLayers |
| `DRUM_SAMPLE_IDS` | `kick`, `snare`, `hat` (procedural only in phase 3) |

Extended `DrumLaneDef` on `SongDef` with optional `sidechain`.

---

## Modules

| Module | Path |
|--------|------|
| Procedural drums | `lib/song/drums/drum-engine.ts` |
| Sidechain duck | `lib/song/drums/sidechain-ducker.ts` + `MasterBus.scheduleSidechainDuck` |
| Riddim grid | `lib/song/drums/riddim-drum-grid.ts` |
| Compile | `compile-schedule.ts` → `type: "drumHit"` |
| Dispatch | `audio-scheduler.ts` → `engine.playDrumHit` |
| Templates | `buildRiddimArrangement` → `ensureRiddimDrums` (mute intro/break/outro) |

---

## Sidechain routing

```
layer strip → fader (song IR) → duckGain (sidechain) → preMaster → master chain
drums ──────────────────────────────────────────────────→ preMaster
```

Kick triggers `duckGain` on `sub` + `body` only — top/FX layers unaffected.

---

## Next (phase 4)

- WAV sample loader (`/public/samples/` or user uploads)
- `cat` combinator for drum + bass layering
- Mix agent rules for drum stem level vs sub RMS

See **phase 87+** — arrangement agents, rule-pack generation UI (`docs/research/arrangement-agent-landscape.md`).
