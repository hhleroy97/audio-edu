# Phase 81–86 — Multibus riddim songs (plan)

**Depends on:** Phases 77–80 (SongDef, scheduler, templates, lesson 08)  
**Research:** `RESEARCH.md`, `docs/research/multibus-song-engine-landscape.md`

---

## Goal

Replace single-preset hot-swap with **parallel layer buses**, **audio-clock scheduling**, and **arranged riddim songs** (intro / drop / break / variation) grounded in the archetype catalog.

---

## Wave breakdown

| Wave | Phase | Deliverable |
|------|-------|-------------|
| **Research** | **81** | GitHits landscape, architecture decision (this doc) |
| **Multibus core** | **82** | `SongLayerEngine`, `MasterBus`, layer registry |
| **Audio scheduler** | **83** | `AudioClockScheduler` — `currentTime` + per-layer gates |
| **Song IR v2** | **84** | `SongLayerDef`, `DrumHit`, combinators, strict lint |
| **Arrangements** | **85** | 3 production templates (16–32 bars), golden timeline tests |
| **Stems + lesson** | **86** | Offline stem bounce, song panel v2, lesson 09 |

---

## Phase 82 tasks (multibus core)

1. `lib/song/multibus/master-bus.ts` — N× `GainNode` → master gain → analyser tap
2. `lib/song/multibus/layer-engine.ts` — wrap `AudioEngine` per layer; `loadPresetOnce(presetId)`
3. `lib/song/multibus/song-layer-engine.ts` — orchestrates layers + shared `AudioContext`
4. Bridge API: `triggerLayerNote(layerId, midi, durationSec, atTime)` — no `loadPreset` per note
5. Tests: `tests/multibus-engine.test.ts` — 2 layers sum without graph replacement
6. Docs: `multibus-song-engine-landscape.md` § implementation
7. Commit: `feat(song): multibus layer engine with master bus`

---

## Phase 83 tasks (audio-clock scheduler)

1. `lib/song/audio-scheduler.ts` — compile flat events → `{ atTime, layerId, action }`
2. Lookahead queue (100ms) using `requestAnimationFrame` or `AudioWorklet` timer fallback
3. Remove `setTimeout` from live path in `SongScheduler` (keep legacy export deprecated)
4. Per-layer gate timers (Map<layerId, timeout>) — delete global `gateCloseTimer`
5. Integrate `SongLayerEngine` in `PatchSongPanel` behind feature flag `songMultibus`
6. Tests: drift tolerance mock — events fire at computed `currentTime` offsets
7. Commit: `feat(song): audio-context scheduler with per-layer gates`

---

## Phase 84 tasks (Song IR v2 + lint)

1. Extend `lib/schemas/song.ts`:
   - `SongLayerDef` — `{ id, presetId, busGain, pan?, muteInSections? }`
   - `DrumHit` — `{ beat, sampleId, velocity }`
   - `PatternCombinator` — `stack | cat | slow`
   - `PatternGroup` — nested events + combinator
2. `lib/song/lint-song.ts` — fail on unknown preset, missing layer on multi-note events, beats > bars
3. Canonical JSON hash (sorted keys) for `inputsHash`
4. Migrate `riddim-drop-01.json` → v2 shape (backward compat parser in `validate-song.ts`)
5. Tests: `tests/song-lint.test.ts`
6. Commit: `feat(song): SongDef v2 layers drums and pattern combinators`

---

## Phase 85 tasks (riddim arrangements)

Production templates in `lib/song/templates/` + `songs/`:

| Template id | Bars | Structure | Layers |
|-------------|------|-----------|--------|
| `riddim-16-standard` | 16 | intro→drop→break→drop | sub + hydraulic + optional top |
| `riddim-32-set` | 32 | 2× drop/break cycle + outro | cat body presets per drop |
| `riddim-tearout-16` | 16 | minimal intro, aggressive dropB | sub + harsh-square-fm + noise |

Pattern content (grounded in catalog):
- Halftime sub on beats 0, 2 (per bar)
- Body on same grid with `durationBeats` 1.5–1.9
- Break: mute body layer, sub holds
- Drop B: `cat` between `hydraulic-press-wobble` and `subfiltronik-loop`
- Optional drum lane: kick 1&3, snare 2&4 (sample placeholders)

Tests:
- Full-bar golden timelines per section
- Preset id lint passes
- Layer mute rules in break

Commit: `feat(song): multibus riddim arrangement templates`

---

## Phase 86 tasks (stems, UI, lesson)

1. `lib/song/render-stems.ts` — offline render per layer → sum → WAV + stem manifest
2. `PatchSongPanel` v2 — layer meters, section label, multibus-only play path
3. `lesson-09-multibus.md` — sub protection + arrangement layers
4. Graph supplement: `technique:multibus-layering`, `technique:arrangement-sections`
5. Update `docs/research/riddim-sound-catalog.md` cross-link
6. Commit: `feat(song): stem render and multibus song mode UI`

---

## Verification (milestone 81–86)

```bash
npm test -- --run tests/song-*.test.ts tests/multibus-*.test.ts
npm run build
# Manual: riddim-16-standard → hear sub+body simultaneously → break mutes body → dropB swap
# Export: stem manifest + master WAV
```

---

## Dependency graph

```
81 (research)
  └── 82 (multibus engine)
        └── 83 (audio scheduler)
              └── 84 (IR v2)
                    └── 85 (templates)
                          └── 86 (stems + UI)
```

---

## Out of scope

- Tone.js / @strudel/web runtime embed
- Full DAW timeline UI
- Automatic generative melody (ML)
- LUFS mastering chain

---

## Reference implementations (GitHits)

| Pattern | Solution ID | Use |
|---------|-------------|-----|
| Web Audio bus merge | `355afbb7` | MasterBus layout |
| Tone channel routing | `d0296a62` | Per-layer gain/send model |
| Strudel stack/cat | `600680ce` | PatternGroup combinators |
| Parallel layers | `3c31252a` | SongLayerEngine Map API |
