# Song depth & musical richness — research & GSD plan (phases 106–111)

> **Date:** 2026-06-16 · GSD research loop (gap audit + community + tonal.js + arXiv)  
> **Goal:** Close the **flat / monophonic / thin** gap after phases 100–105 — richer harmony, section timbre runtime, sample playback, mod catalog rotation, and 4-bar phrase variation.

---

## Executive summary

Phases 100–105 shipped rhythm pocket v2, sample *metadata*, TimbreAgent *plans*, ModFxAgent *schema*, and progress UI. User feedback and code audit confirm the **musical output is still flat**:

| Symptom | Root cause in code | Phase fix |
|---------|-------------------|-----------|
| “No chords” | `HarmonyAgent` → scale **degrees** only; `PatternAgent` → **monophonic** halftime roots | **106** ChordVoicingAgent |
| Same bass root for 8 bars | Static `["i","i","iv","i"]` + pentatonic; no **per-bar** progression index | **106** + **107** |
| Intro/build/drop sound identical | `TimbreAgent` plans per section but song loads **one global** layer stack | **108** Section timbre runtime |
| Thin drums | `loadAllDrumSamples()` never called from Patch Lab | **109** Sample playback wiring |
| Same 2–3 presets | 18 archetypes in catalog; rule packs + eval gates too weak | **110** Mod catalog + packs |
| Robotic 2-bar loop | No **4-bar phrase templates** (REMI-z #128 backlog) | **111** RhythmPhraseDef |

**Recommended GSD order:** 109 first (quick audible win) → 108 (section contrast) → 106–107 (harmony) → 110–111 (depth + variation).

---

## Community research (Reddit proxies)

Direct fetch of `reddit.com/r/synthrecipes` and `r/AudioSynthesis` **blocked** from automation (same as cycle 1–4 in `riddim-research-loop.md`). This cycle used **indexed web summaries + accessible forum mirrors** that reproduce the same producer advice those subreddits circulate.

### r/synthrecipes themes (via DSF + Preset Drive + EDM Templates)

| Theme | Producer advice | Port to agents |
|-------|-----------------|----------------|
| **Sub/body split** | Separate sine sub; HP body at 80–100 Hz; no LFO on sub | Already in Patch Lab P0 — **108** must swap presets per section |
| **Dual-LFO motion** | LFO1 on cutoff @ 1/4; LFO2 @ **half rate** on FM index + FX | Wire `dual-lfo-fm-drop`, `infekt-constant-motion` in **110** |
| **Allpass → comb chain** | ~2–5% allpass @ ~20 Hz → comb/flanger = metallic riddim | Map to `dsf-allpass-comb` preset in build/drop packs |
| **Layer stacking ≠ stacking patches** | “Stack three Serums” → phase cancellation; use **frequency slotting** | Evaluation: `minLayerHpfSeparation` optional gate **110** |
| **Turn off quantize** | DSF `_ronzlo`: humanize basslines | **107** `microTimingMs` on pattern notes |
| **Chop chord samples** | DSF `sleeps`: “chord/piano melodies to chop up” | **106** voicing agent + **107** chop phrases on body layer |

**Primary forum source:** [DSF Riddim techniques thread](https://community.dsf.ninja/t/riddim-a-type-of-dubstep-production-techniques-help-thread/12308) — cited as Reddit-proxy #134 in `sources.md`.

### r/AudioSynthesis themes (via layering guides + phase-alignment literature)

| Theme | Advice | Port |
|-------|--------|------|
| **3-band stack** | Sub 20–100 Hz / body 100–800 Hz / top 800 Hz+ | TimbreAgent already models — **108** emits per-section `layerGain` + `layerPreset` |
| **Phase alignment** | Align transients; avoid “flam” between sub and body | **107** optional `phaseAlignMs` on sub vs body note onsets |
| **Mono sub rule** | Sub strictly mono; width only above 200 Hz | Matches Patch Lab CV block — document in rule packs |
| **Variation over 32 bars** | DSF: “vwoom × 32 bars” boredom → preset/mod swap at drop B | **110** sick-drop + infekt packs |

**Reddit-proxy (explicit):** [EDM Templates — layering without phase cancellation](https://edmtemplates.net/blogs/edm-templates-blog/sound-layering-techniques) references Reddit/YouTube “stack layers” advice as **dangerous for bass music** — informs eval gates.

### Melodic-dubstep chord guidance (adjacent genre, harmonic target)

Riddim is often monophonic, but **user request is richer harmony**. Melodic dubstep research (#136–138) validates a deterministic port:

- Drop uses **chord roots** with sub following root; body can carry **dyad/triad voicings** in mid band
- Progressions: `i–VI–III–VII`, `i–iv–VI–V` (natural minor / harmonic minor)
- Alternate **chord sections vs single-note** phrases within a drop (#136 Preset Drive melodic dubstep guide)

We do **not** port supersaw pads — only **bass-register voicings** via `@tonaljs/voicing`.

---

## Code audit (post-105 gaps)

### Harmony — degrees ≠ chords

```20:37:lib/song/agents/harmony-agent.ts
export function progressionToDegrees(...) {
  const chords = Progression.fromRomanNumerals(key, romans);
  // ... maps to scale degree index only
}
```

`PatternAgent` calls `midiFromScaleDegree` → **one MIDI note per hit**. No `@tonaljs/voicing`, no polyphony, no bar-aligned chord index.

### Timbre — plans not scheduled

`runTimbreAgent` returns `plans[]` but `arrangement-agent.ts` sets `layers = timbreResult.layers` from **drop-a only**. No `layerPreset` events from timbre plans at section boundaries (except manual `bodyPresetId` on drop-b in sick-drop pack).

### Samples — registry not loaded

`DrumEngine.setSampleBuffer` exists; `PatchSongPanel` never calls `loadAllDrumSamples()`.

### Mod/FX — schema only for sends

`ModFxAgent` writes `drums.sendFx`; no convolver/delay bus in `DrumEngine` or `MasterBus`.

### Evaluation — permissive gates

`RIDDIM_STANDARD_16`: `minUniqueBodyPresets: 1` — thin output passes.

---

## Technical research — `@tonaljs/voicing` (local / npm)

GitHits backend unavailable this session; API verified from installed package (`node_modules/@tonaljs/voicing/README.md`):

| API | Use in phase 106 |
|-----|------------------|
| `Progression.fromRomanNumerals(key, romans)` | Already used — extend to **chord symbols** not just degrees |
| `Voicing.get(chord, range, dictionary, voiceLeading, lastVoicing)` | Pick bass-register voicing per bar |
| `Voicing.search(chord, range, dictionary)` | Golden-test alternate voicings |
| `@tonaljs/voicing-dictionary` `lefthand` / custom `{ "m7": ["1P 5P 7m"] }` | Riddim-safe **root+5th** dyads for sub+body |

**Bass voicing dictionary (proposed):**

```ts
const RIDDIM_BASS_VOICINGS = {
  "": ["1P 5P"],           // power fifth — sub+body unison spread
  "m": ["1P 5P"],
  "m7": ["1P 5P 7m"],      // optional color on body hits
  "sus4": ["1P 4P 5P"],
};
```

**Range:** sub octave 1, body octave 2–3 — keep voicings below 400 Hz for riddim.

---

## arXiv & prior research (carried forward)

| Source | Finding | Phase |
|--------|---------|-------|
| #128 REMI-z | 4-bar drum phrase boundaries | **111** |
| #131 GraphMuGen | Phrase → structure hierarchy | **111** |
| #129 rhythm discriminator | Velocity + timing quality | Extend eval in **107**, **111** |
| #35 Bass accompaniment diffusion | Style-conditioned bass stems | Inform **110** preset rotation tables only (no ML) |
| #112 tonal progression | Roman numerals | **106** extends |

---

## GSD phases 106–111

### Phase 106 — ChordVoicingAgent (Harmony v2)

**Goal:** Bar-aligned chord roots + optional dyads; richer scales/progressions in rule packs.

**Schema** (`lib/schemas/harmony.ts` extend):

```ts
HarmonyDef = {
  progression: ["i", "VI", "III", "VII"],
  scale: "minor",                    // override pack.scale
  voicingMode: "root" | "fifth" | "triad",
  barsPerChord: 1 | 2 | 4,
  kindProgressions?: { drop: [...] },
}
SectionHarmonyPlan = {
  ...
  barChords: { barOffset: number; chord: string; midiNotes: number[] }[],
}
```

**Agent:** `runChordVoicingAgent` after HarmonyAgent — uses `Voicing.get` + voice-leading between bars.

**PatternAgent:** Emit polyphonic `note` events (same beat, multiple midis on sub/body) OR `chord` event kind (new) compiled to stacked notes.

**Rule packs:** F# natural minor; sick-drop uses `i–iv–VI–V` on drop B.

**Eval:** `minUniqueChordRoots ≥ 2` per 8-bar drop; `minBarChordChanges ≥ 2`.

**Commit:** `feat(song): ChordVoicingAgent + harmony v2 schema (phase 106)`

**Sources:** #112, #136–138, `@tonaljs/voicing`

---

### Phase 107 — MelodicPhraseAgent (motion + humanize)

**Goal:** Break halftime monotony — chops, octave jumps, off-quantize micro-timing.

**Schema** (`lib/schemas/melody.ts`):

```ts
MelodyDef = {
  enableChops: boolean,
  chopEveryBars: 2,
  octaveJumpProbability: 0.15,
  microTimingMs: 12,        // DSF "turn off quantize"
  hocketAlternate: boolean,  // melodic dubstep hocket port
}
```

**Agent:** Post-PatternAgent — mutates body/sub note events per section kind.

**Eval:** `minDistinctBodyMidis ≥ 3` in drop; `microTimingSpreadMs > 0`.

**Commit:** `feat(song): MelodicPhraseAgent + humanized bass motion (phase 107)`

**Sources:** #134 DSF quantize; #136 hocket; #127 velocity evolution

---

### Phase 108 — Section timbre runtime

**Goal:** `TimbreAgent` plans → `layerPreset` + `layerGain` at every section boundary.

**Agent change:** `runTimbreAgent` also returns `sectionEvents: PatternEventType[]` OR new `TimbreRuntimeAgent` merges plans into sections.

**Fix top layer:** Use `bySectionKind.top`, not only `defaultTopPresetId`.

**Eval:** `minSectionPresetSwaps ≥ 3` per 16-bar song.

**Commit:** `feat(song): section-scoped timbre preset scheduling (phase 108)`

**Sources:** #134–135 layering; catalog §1–§6

---

### Phase 109 — Sample playback + drum send audio

**Goal:** Audible WAV drums; snare reverb send wired.

**Deliverables:**

- `PatchSongPanel` + offline render: `await loadAllDrumSamples(ctx, drumEngine)`
- `DrumEngine`: optional `SendBus` (convolver IR stub + delay) driven by `drums.sendFx`
- Per-section send automation from ModFxAgent (not global max only)

**Eval:** `sampleHitRatio ≥ 0.8` when `requireSamples: true`.

**Commit:** `feat(song): wire sample drums + drum send FX audio (phase 109)`

**Sources:** #107, #132–133

---

### Phase 110 — Mod catalog rotation + rich rule packs

**Goal:** Use ≥6 of 7 mod profiles + 3 new rule packs (yoi, tearout, infekt-motion).

**Deliverables:**

- `ModCatalogAgent` or extend ModFxAgent: map `section.kind` + `seed` → profile rotation
- Rule packs: `RIDDIM_YOI_16`, `RIDDIM_TEAROUT_16`, `RIDDIM_INFEKT_16`
- Raise default eval: `minUniqueBodyPresets: 2`, `minModKeyframesPerDrop: 4`

**Commit:** `feat(song): mod catalog rotation + archetype rule packs (phase 110)`

**Sources:** mod-schemas.ts; catalog §2–§4; #134 dual-LFO

---

### Phase 111 — RhythmPhraseDef (4-bar templates)

**Goal:** REMI-z-informed phrase slots; A/B/C/D bar variants within drops.

**Schema** (`lib/schemas/rhythm.ts`):

```ts
RhythmPhraseDef = {
  phraseLengthBars: 4,
  templates: Record<RulePackSectionKind, string[]>,  // slot ids
}
```

**Agent:** Extend `DrumAgent` / `GrooveAgent` — pick phrase template per 4-bar window.

**Eval:** `phraseVariationBars ≥ 4` in drop sections.

**Commit:** `feat(song): 4-bar rhythm phrase templates (phase 111)`

**Sources:** #128, #131

---

## Dependency graph

```
106 (chord voicing) ──► 107 (melodic phrases)
108 (section timbre) ── parallel ──► 109 (samples + sends)
110 (mod catalog) ── depends on 108 top layer active
111 (4-bar phrases) ── depends on 101 pocket
```

**Quick wins first:** 109 → 108 → 106 → 107 → 110 → 111

---

## Definition of done (milestone 106–111)

- [ ] Generated drops use ≥2 distinct chord roots with bass-register voicings
- [ ] Section boundaries swap presets (intro ≠ drop timbre)
- [x] WAV drums play in Patch Lab when files present (phase 109)
- [x] Snare send reverb audible on drop sections (phase 109)
- [ ] ≥3 rule packs exercise ≥6 archetype presets
- [ ] 4-bar drum phrase variation in drops
- [ ] Golden snapshots + `npm test` green per phase

---

## Implementation notes (shipped)

| Phase | Key paths |
|-------|-----------|
| **109** | `lib/song/drums/drum-send-bus.ts`, `lib/song/multibus/prepare-engine.ts`, `drumSendFx` pattern event, `ModFxAgent` per-section sends |

---

## What NOT to do

- No Reddit API scraping — cite forum proxies + manual thread paste backlog
- No ML chord generation — `@tonaljs/voicing` deterministic only
- No supersaw pad stack — bass-register harmony only
- No LLM rule-pack authoring until **111** eval metrics ship

---

## Sources

See `docs/research/sources.md` #134–145.
