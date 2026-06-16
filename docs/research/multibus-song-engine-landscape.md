# Multibus song engine — library landscape (GitHits research)

> **Phase 81 research** · Sources in `docs/research/sources.md` (#89–95).  
> Goal: parallel layer buses + audio-clock scheduling for **real riddim arrangements** (sub + body + FX simultaneously).

---

## Executive summary

Phases 77–80 shipped a **single-graph scheduler** that hot-swaps presets via `loadPreset()` — fine for a vertical slice, but not how riddim is produced. Professional riddim stacks **independent layers** (clean sub, wobble body, optional top/noise) summed on a master bus, with arrangement variation across sections.

GitHits + existing Patch Lab code point to **native Web Audio multibus** (no new npm runtime dependency) inspired by Tone.js channel/send patterns and Strudel `stack`/`cat` combinators.

| Approach | Repo / package | Fit for audio-edu |
|----------|----------------|-------------------|
| **Parallel GainNode buses → master** | Web Audio API (GitHits #355afbb7) | ✅ Best — matches existing `mixer` node + `AudioEngine` |
| **Tone.js Channel + send buses** | `Tonejs/Tone.js` (GitHits #d0296a62) | Reference only — we avoid Tone dependency |
| **Strudel stack / cat / slow** | `tidalcycles/strudel` | Pattern IR combinators — port subset to Zod, no AGPL embed |
| **SuperCollider / Sonic Pi stems** | supercollider, sonic-pi | Offline reference; too heavy for browser v1 |
| **Per-layer Patch Lab engine** | *this repo* (`sub-body-stack` preset) | ✅ Extend to N parallel `AudioEngine` subgraphs |

**Decision:** Build `SongLayerEngine` — one frozen preset graph per layer, shared `AudioContext`, summed through `lib/song/multibus/master-bus.ts`. Schedule with `AudioContext.currentTime`, not `setTimeout`.

---

## GitHits evidence

### 1. Web Audio multibus (ChannelMerger / per-bus Gain)

GitHits solution `355afbb7` — per-bus `GainNode` → `ChannelMerger` → destination; notes scheduled with `audioContext.currentTime + offset`. Same primitive as our `createMixerRuntime` (A/B inputs) but generalized to N layers.

**Mapping:** `SongLayer` → bus gain → master analyser → destination.

### 2. Tone.js Transport + Channel routing

GitHits solution `d0296a62` — `Tone.Channel` per part, effect send buses, `Tone.Loop` scheduled on `Transport` with `triggerAttackRelease(..., time)`. Validates:

- **Per-part volume/pan** before master
- **Shared tempo clock** across loops
- **User-gesture `Tone.start()`** before scheduling

**Port without Tone:** Patch Lab already has `transportBpm` + LFO sync; multibus adds per-layer `AudioEngine` instances keyed to the same `ctx.currentTime` origin.

### 3. Strudel pattern combinators (stack / cat / slow)

GitHits solution `600680ce` — minimal JS engine demonstrating:

- `stack(...)` — simultaneous layers
- `cat` / `slowcat` — round-robin sections per cycle (drop A / drop B)
- `slow(factor)` — halftime feel (riddim = `slow(2)` on drum grid)

**Port to Zod IR:** `PatternCombinator` enum on `SectionDef` or nested `PatternGroup` — no `@strudel/web` embed (AGPL gate from phase 76).

### 4. Parallel layer patch lab (sub + bass)

GitHits solution `3c31252a` — Map of named layers, each `osc → gain → mixBus`, optional per-layer analyser. Mirrors riddim **sub protection** (#19, #48): sub bus never receives wobble CV.

---

## What Patch Lab already has

| Asset | Location | Multibus use |
|-------|----------|--------------|
| 2-input mixer node | `lib/patch/runtime-nodes.ts#createMixerRuntime` | Master bus or per-layer sub+body inside one preset |
| Sub+body stack preset | `sub-body-stack` in `presets/index.ts` | Template for **single-layer** stacked graph |
| 35 riddim presets | `presets/` + `riddim-archetypes.ts` | One preset id per `SongLayer.presetId` |
| SongDef IR | `lib/schemas/song.ts` | Extend with `layers[]`, `drumLane`, combinators |
| Scheduler (MVP) | `lib/song/scheduler.ts` | Replace timer core with audio clock |

**Gap:** `loadPreset()` replaces the entire UI graph — song mode cannot play sub + growl concurrently today.

---

## Target architecture (phase 82–86)

```
SongDef v2
  ├── meta (bpm, key, bars)
  ├── layers[]: { id, presetId, busGain, muteRules }
  ├── sections[]: { pattern groups, combinator: stack|cat, automations }
  └── drums?: { sampleIds, halftime grid }

SongLayerEngine (lib/song/multibus/)
  ├── Map<layerId, AudioEngine subgraph>  // frozen preset graphs
  ├── MasterBus → Analyser → destination
  └── scheduleAt(ctxTime, event) per layer

SongPlayer
  ├── audio-clock scheduler (lookahead 100ms)
  ├── per-layer gate envelopes (no global gateCloseTimer)
  └── offline: render stems → sum → WAV + manifest
```

---

## Riddim arrangement idioms (for phase 85 songs)

From `docs/research/riddim-sound-catalog.md` + Infekt/UKF sources (#27, #35):

| Section | Layers | Variation |
|---------|--------|-----------|
| **Intro** | sub only or filtered body | sparse halftime hits |
| **Drop A** | `clean-sub` + `hydraulic-press-wobble` | 1/4 wobble, 4-bar loop |
| **Break** | sub hold + noise/top duck | gate body, keep sub |
| **Drop B** | `clean-sub` + `harsh-square-fm` or `cat` preset swap | macro throw on comb |
| **Outro** | fade master, strip top | |

Pattern variation via **`cat`** between archetype presets (not random) — matches Subfiltronik repetition + drop swap (#64).

---

## Risks

| Risk | Mitigation |
|------|------------|
| CPU: N full graphs | Cap at 3 layers live; optional 2-layer + internal mixer preset |
| Phase cancellation | Sub bus HP/LP rules in layer lint; document in song template |
| Scheduler drift | AudioContext only; preload graphs before t0 |
| Offline memory | Chunked stem render per section (phase 79 pattern) |

---

## Related artifacts

- `docs/research/procedural-music-landscape.md` — phase 76 path C-lite
- `docs/research/riddim-sound-catalog.md` — preset ids for layer assignments
- `.planning/phases/81-multibus-riddim-songs/` — executable GSD plan
