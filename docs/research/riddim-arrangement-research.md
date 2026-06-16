# Riddim arrangement research — drops, layering, and song generation architectures

> **Research cycle 5** (2026-06-16): GitHits deep pass on Strudel/Tone.js/Web Audio multibus patterns,
> cross-referenced with existing riddim catalog (#2–#76), Infekt/UKF arrangement guides (#27, #35, #94),
> and DSF/PresetShare modulation recipes (#64, #72, #73).
>
> **Implementation:** `lib/song/riddim/` — mod profiles, pattern builders, `buildRiddimArrangement()`.

---

## Executive summary

Robust riddim song generation is **not** a single synth preset — it is a **stacked architecture**:

| Layer | Role | Modulation rule |
|-------|------|-----------------|
| **Sub** | Clean sine/F# root, mono pocket | **No wobble CV** — protected bus (#19, #48, #93) |
| **Body** | 1/4 halftime wobble or FM growl | LFO→filter, LFO→FM index, macro throws (#11, #64) |
| **Top** | Comb/metallic fizz, offbeat stabs | Sparse; HPF >2 kHz in mix (#2, #47) |

Arrangement = **sections** (intro → build → drop → break → drop B) × **parallel multibus layers** × **audio-clock automation** on body/top only.

GitHits validates three implementation pillars already in this repo:

1. **Web Audio multibus** (#89) — N `GainNode` buses → master; schedule at `currentTime`
2. **Tone.js Channel + Transport** (#90) — per-part volume; `triggerAttackRelease(..., time)` pattern
3. **Strudel combinators** (#91) — `stack` / `cat` / `slow` as declarative section algebra (ported to Zod, no AGPL embed)

---

## How riddim drops work (producer + academic grounding)

### Halftime grid (the pocket)

At **140 BPM**, riddim **feels** like **70 BPM** because bass hits land on beats **1 and 3** of each 4/4 bar (every other quarter note). Strudel expresses this as `slow(2)` on a drum/bass pattern (#91).

Patch Lab maps this to `buildHalftimeGroove()` — note events on local beats `0, 2, 4, 6…` with **long gate** (~1.7–1.9 beats) for hydraulic sustain (#63).

### What makes a drop “sick”

From Infekt (#35, #94), UKF riddim guide (#27), and DSF wobble threads (#64):

| Technique | When | Song IR expression |
|-----------|------|-------------------|
| **Sub-only intro** | Bars 1–2 | `muteLayers: ["body","top"]` + sparse sub |
| **Pre-drop build** | 1–2 bars before drop | Body gain ramp 0→0.35; filter/LFO depth creep |
| **Impact** | Drop bar 1 | Simultaneous sub+body notes + mod profile keyframe @ beat 0 |
| **Bar-3 swell** | Drop bar 3 | LFO depth throw (+20–30%) — “hydraulic press” (#63) |
| **Bar-4 throw** | Drop bar 4 | FM index spike or resonance bump before loop repeat |
| **Break** | 4–8 bars | Body/top muted; sub holds halftime |
| **Drop B (`cat`)** | Second drop | `layerPreset` swap + harsher mod profile (#91) |

**Infekt rule:** bass must **never sit static** — dual LFO chains (cutoff @ 1/4, index @ 1/8 or half-rate) + phaser depth automation (#68).

### Modulation layering schemas (Serum culture → Patch Lab)

Academic **Modulation Discovery** (#11) finds LFO→filter in ~98% of hard bass presets; DSF threads (#64) add:

```
Schema A — Hydraulic wobble (Subfiltronik pocket)
  LFO₁ (1/4 tri) → filter cutoff
  optional: bar-3 depth swell, bar-4 drive bump

Schema B — Dual LFO FM (Virtual Riot / BadKlaat)
  LFO_cut (1/4) → filter cutoff
  LFO_idx (1/4 half-rate OR 1/8) → FM index
  bar-2: FM index manual spike

Schema C — Infekt constant motion
  LFO → cutoff + LFO → FM index
  phaser/comb depth automation (never static)

Schema D — Tearout / Drop B
  high FM index sustain + comb feedback throw
  preset swap via layerPreset (cat combinator)

Schema E — Top fizz (32-bar sets)
  offbeat short gates on top layer
  comb depth throws on beats 2 & 6 (macro culture #72)
```

These are codified as **`RIDDIM_MOD_PROFILES`** in `lib/song/riddim/mod-schemas.ts` — each profile lists `nodeId`, `param`, `beat` keyframes validated against preset graphs.

**Hard rule:** profiles target **body** or **top** layers only. Sub layer presets (`clean-sub`) have **no** mod profile entries.

---

## Song generation architectures (GitHits survey)

### Tier 1 — Pattern IR + native Web Audio (this repo)

```
SongDef v2 (Zod)
  ├── layers[]     → SongLayerEngine (parallel AudioEngine graphs)
  ├── sections[]   → intro/drop/break + muteLayers + combinator
  └── events[]     → note | layerGain | layerPreset | automation

compileMultibusSchedule() → CompiledAction[] @ AudioContext.currentTime
MultibusAudioScheduler  → rAF dispatch + per-layer gates
```

**Why:** Full Zod control, no Tone/Strudel runtime deps, matches Patch Lab presets exactly.

### Tier 2 — Strudel / Tidal (reference)

Strudel (#80, #91) provides `stack`, `cat`, `slow` over cyclic patterns. We **port the algebra** into `PatternCombinator` and section specs — we do **not** embed `@strudel/web` (AGPL gate, phase 76).

### Tier 3 — Tone.js Transport (reference)

Tone (#90) `Transport` + `Channel.send/receive` validates:
- Shared clock across parts
- Per-channel gain before master
- `triggerAttackRelease(note, duration, time)` scheduling

Ported as `MultibusAudioScheduler` + `MasterBus` without Tone dependency.

### Tier 4 — Offline / stems

`renderMultibusStems()` uses `OfflineAudioContext` + same compiled schedule — enables stem manifest for A/B (#55 resample workflow).

---

## Arrangement templates shipped

| Template id | Bars | Structure | Mod profiles |
|-------------|------|-----------|--------------|
| `riddim-sick-drop-16` | 16 | intro(2) → build(2) → drop A → break → drop B | `hydraulic-drop-swell`, `drop-b-preset-swap-throw` |
| `riddim-sick-drop-32` | 32 | intro → drop A(8) → break → drop B(8) → break → outro | `infekt-constant-motion`, `dual-lfo-fm-drop`, `macro-comb-top-stab` |

Built programmatically via `buildRiddimArrangement()` — same input config → same SongDef every time.

---

## Gaps & next steps

| Gap | Mitigation |
|-----|------------|
| Drum lane schema-only | Wire sample playback or Strudel-style sample triggers |
| `cat` combinator metadata-only | Implement round-robin preset alternation per cycle |
| Automation ramp curves | Use `linearRampToValueAtTime` for sweeps (#96) |
| Preset-hot-swap audible glitch | Pre-load drop B graph on second layer engine |
| Lint nodeId vs preset graph | Extend lint to validate automation targets per layer preset |

### Phase 1 mix chain (shipped)

Deterministic passable-mix baseline in `lib/song/multibus/`:

| Module | Role |
|--------|------|
| `mix-profiles.ts` | `MixProfile` + HPF/LPF/busGain/songGain defaults per layer role |
| `layer-mix-strip.ts` | Per-layer EQ + optional mono sum before fader |
| `master-chain.ts` | Glue compressor + limiter (~−2 dBTP) |
| `layer-engine.ts` | `songGain` trim + scaled preset params for multibus context |

`SongLayerDef` adds optional `mixProfile` and `songGain`. Mod profiles retuned for conservative section entries.

---

## Related artifacts

- `docs/research/multibus-song-engine-landscape.md` — phase 81 GitHits multibus decision
- `docs/research/riddim-sound-catalog.md` — timbre presets per archetype
- `docs/research/procedural-music-landscape.md` — phase 76 IR design
- `lib/song/riddim/` — mod schemas + arrangement builder
- `lib/patch/lessons/lesson-09-multibus.ts` — learner-facing multibus lesson
