# Chords, polyphony & timbre intelligence — milestone 116–121

> **Date:** 2026-06-16 · GSD research loop (post-112–115 audit)  
> **Motivation:** User feedback — harmony roots move but **no audible chords**; default
> presets lack variety; layers need synthesis-grounded selection, not random picks; beat-level
> automation could tune uniqueness per phrase slot.

---

## Executive summary

Phases 106–115 fixed pitch tracking, harmony-locked sub, synth sends, and melodic spread.
The remaining gap is **architectural**, not harmonic planning alone:

| Symptom | Root cause | Phase fix |
|---------|------------|-----------|
| “Still no chords” | `ChordVoicingAgent` computes `bodyDegrees[]` but `PatternAgent` picks **one** degree per hit via `pickDegree()`; `LayerEngine` is **monophonic** (one gate, one frequency) | **116 + 117** |
| Same 3–4 presets everywhere | `TimbreAgent` uses static `bySectionKind` map; 18+ archetypes exist but only ~6 appear in rule packs | **118** |
| Adding a layer feels arbitrary | No documented **energy / spectral slot** model tying layer on/off to mix balance | **119** |
| Beats feel templated | `AutomationAgent` only expands mod profiles globally; no phrase-slot or bar-index macro curves | **120** |
| Output passes eval but sounds thin | Eval counts distinct **MIDI** not **simultaneous voices**; no chord-density gate | **121** |

**Recommended GSD order:** 116 (engine) → 117 (chord IR) → 118 (timbre scoring) → 120 (automation) → 119 (theory/docs) → 121 (eval).

---

## Deep dive — why chords are silent today

### 1. Pattern layer — monophonic emission

```88:104:lib/song/agents/pattern-agent.ts
  const midiForLayer = (layer: "sub" | "body", localBeat: number) => {
    // ...
    const pool = layer === "sub" ? degrees.subDegrees : degrees.bodyDegrees;
    return midiFromScaleDegree(
      key,
      scale,
      pickDegree(pool, rng, hitIndex + (layer === "body" ? 7 : 0)),
      octave
    );
  };
```

Even when `bodyDegrees = [root, fifth]`, `pickDegree` returns **one** MIDI per halftime hit.
There is no code path that stacks root+fifth on the same beat.

### 2. Runtime layer — single voice

```107:111:lib/song/multibus/layer-engine.ts
  scheduleNote(midi: number, startTime: number, durationSec: number): void {
    this.setNoteMidi(midi, startTime);
    this.setGate(true, startTime);
    this.setGate(false, startTime + durationSec);
  }
```

One `AudioEngine` graph per layer. Overlapping notes **retune the same oscillator** — the last
scheduled pitch wins. Multibus solved **parallel layers** (sub + body + top), not **parallel
notes within a layer**.

### 3. Harmony plan — degrees ≠ voiced chord

Phase 106 shipped `voicingMode: "fifth"` → `bodyDegrees: [root, fifth]` but never `@tonaljs/voicing`
MIDI arrays. Triad mode was sketched in research but not implemented in schema.

**Conclusion:** Chords require **two coordinated changes** — polyphonic engine voices **and**
pattern events that fire multiple notes per strike.

---

## Synthesis-grounded layer model (energy & spectrum)

Grounded in experiment 06 layering theory (#7) and riddim catalog §5 (#47, #2):

| Layer | Freq slot | Perceived energy | With layer ON | With layer OFF |
|-------|-----------|------------------|---------------|----------------|
| **Sub** | 20–100 Hz | Felt weight, chest impact | Full low-end; sidechain pump reads stronger | Thin kick-only low end; mix feels “floating” |
| **Body** | 100–800 Hz | Groove motion, harmonic identity | Wobble/FM movement; **chord dyads live here** | Sub alone = monotone root; no mid harmonics |
| **Top** | 800 Hz–4 kHz | Aggression, ear fatigue risk | Metallic fizz, phrase hooks | Cleaner drops; less “sick” on headphones |

### Adding a layer — compositional effect

1. **Sub only:** Maximum mono compatibility; energy from rhythm not harmony. Riddim minimal (#64).
2. **Sub + body:** Genre default. Body carries LFO motion; sub must stay **static sine** (no wobble CV on sub path — Patch Lab P0 rule).
3. **Sub + body + top:** Peak drop energy. Risk: phase smear if body unison wide; mitigated by HPF on top (#2 Preset Drive).

**Not random selection:** Each archetype preset carries `techniqueTags` in
`lib/patch/presets/riddim-archetypes.ts`. Phase **118** scores presets by:

- `spectralBand`: sub | body | top (derived from signal flow)
- `motionClass`: static | wobble | dual-lfo | morph | screech
- `harmonicLoad`: mono | dyad | triad-capable (FM richness)

**Scoring function (deterministic):**

```
score(preset, ctx) =
  sectionKindWeight[kind] * bandMatch(preset, targetLayer)
  + progressionMotionBonus(preset, chordChangeRate)
  + packFamilyAffinity(preset, rulePackId)
  + seededTieBreak(seed, preset.id)
```

Pick highest score from catalog **family** (§1 groove, §2 FM, …) — never uniform random.

---

## Polyphonic engine design (phase 116)

### Option A — Voice pool per layer (recommended)

- `LayerEngine` owns `VoicePool` of 2–4 lightweight `AudioEngine` clones sharing one mix strip input.
- `scheduleNote` → allocate free voice; `scheduleChord(midis[])` → parallel voices.
- Voice steal: oldest gated-off voice first (standard subtractive synth).

**Pros:** Minimal change to preset graphs; each voice is full patch.  
**Cons:** 4× CPU per chord layer — acceptable for 3 layers × 4 voices in browser.

### Option B — Internal unison as chord

- Retune detune module voices to chord intervals.

**Rejected:** Not all presets use detune; FM/wavetable paths differ.

### Option C — Separate layer per chord tone

- Body-root layer + body-fifth layer.

**Rejected:** Explodes mix bus; breaks timbre agent 3-layer model.

### Scheduler IR

Prefer **multiple `note` events** at same `beat` (no new schema kind initially):

```ts
{ kind: "note", layer: "body", midi: 42, beat: 0, durationBeats: 1.7 }
{ kind: "note", layer: "body", midi: 49, beat: 0, durationBeats: 1.7 }
```

`compileMultibusSchedule` unchanged; `dispatchMultibusAction` calls `scheduleChord` when
actions share beat+layer (batch in compiler optional optimization).

---

## Chord voicing v3 (phase 117)

Extend `HarmonyDef.voicingMode`:

| Mode | Body notes (bass register) | Use |
|------|---------------------------|-----|
| `root` | Root only | Intro sparse |
| `fifth` | Root + P5 (current) | Riddim dyads |
| `triad` | Root + P5 + P4/P5 stack via `@tonaljs/voicing` | Melodic dubstep drops |
| `spread` | Dyad + octave spread (+12 on fifth) | Wide body, mono-safe sub |

**BarHarmonySlot extension:**

```ts
bodyMidis: z.array(z.number().int().min(0).max(127)).min(1).max(4)
```

Populate in `runChordVoicingAgent` using bass dictionary from phase 106 research:

```ts
Voicing.get(chordSymbol, ["F#1", "C4"], BASS_DICTIONARY)
```

**PatternAgent change:** On body halftime hits, iterate `slot.bodyMidis` — emit one event per MIDI.

**Sub rule:** Always monophonic root (`slot.rootMidi`) — never stack fifth on sub layer.

---

## Timbre intelligence (phase 118)

### Catalog metadata (new Zod sidecar)

`PresetArchetypeMeta`:

```ts
{
  presetId: string;
  catalogSection: "groove" | "fm" | "formant" | "metallic" | "layer-stack" | "tearout";
  spectralBand: "sub" | "body" | "top";
  motionClass: "static" | "wobble" | "dual-lfo" | "morph" | "screech";
  harmonicRichness: 1 | 2 | 3;  // how well it supports dyads
  techniqueTags: string[];       // existing
}
```

Generate from `riddim-archetypes.ts` + `RIDDIM_ARCHETYPE_SECTIONS` — no hand-wavy randomness.

### TimbreScoringAgent

Replaces static `DEFAULT_TIMBRE.bySectionKind` picks:

1. Filter catalog by `spectralBand === layer`.
2. Score by section kind + harmony density (`barSlots.length`, chord change rate).
3. Enforce diversity: `minUniqueBodyPresets` across song via round-robin on top-N scores.
4. Respect `dropBBodySwap`, pack overrides.

**Example:** Build section with fast chord changes → prefer `dual-lfo` / `infekt-constant-motion`.
Break section → `static` / sparse sub only.

---

## Beat-aware automation (phase 120)

Current `AutomationAgent` expands static mod profiles once per section (#90). Gaps:

| Opportunity | Mechanism | Synthesis basis |
|-------------|-----------|-----------------|
| Phrase A vs D contrast | Map `RhythmPhraseDef` slot → macro target offset | Macro fan-out (#72) |
| Fill bar filter open | Bar index mod 4 === 3 → automate `filt-1.cutoff` | Build-up tension (#94) |
| Drop B preset morph | `layerPreset` + 2-bar `wt-pos` automation | WT morph (#76) |
| Ghost-note velocity | GrooveAgent velocities → drum gain automation | Humanization (#107) |
| Chord-stab choke | Short body gate on triads; long on roots | Hydraulic chop (#64) |

**New agent:** `BeatAutomationAgent` (or extend AutomationAgent) — inputs: `rhythmPhrase`,
`harmony.barSlots`, `seed`. Outputs: time-indexed `automation` events on bar boundaries.

**Determinism:** All curves keyed by `seed:beatAuto:${sectionId}:${bar}`.

---

## Evaluation upgrades (phase 121)

| Gate | Metric | Threshold |
|------|--------|-----------|
| `minSimultaneousBodyNotes` | Max count of body notes sharing same beat (drops) | ≥ 2 when `voicingMode !== "root"` |
| `minArchetypePresetsUsed` | Unique body preset ids across song | ≥ 4 |
| `minPhraseMacroKeyframes` | Automation events tied to phrase slots | ≥ 4 per drop |
| `minTimbreScoreSpread` | Std dev of timbre scores (anti-collapse) | > 0.15 |

---

## Sources (provenance)

| ID | Source | Use |
|----|--------|-----|
| #7 | Experiment 06 layering theory | Layer energy / spectral slots |
| #2 | Preset Drive riddim wobble | Body 80–400 Hz; sub split |
| #64 | DSF riddim thread | Repetition vs variation; chop chords |
| #136 | Melodic dubstep guide (Preset Drive) | Triad drops, sub follows root |
| #11 | Mitcheltree DDSP | LFO prevalence validates automation focus |
| #47 | Multiband layering doc | Three-band stack rules |
| #134–138 | Song depth research | Prior harmony roadmap |

---

## Definition of done (milestone 116–121)

- [ ] Body layer plays ≥2 simultaneous notes in drops (audible dyad/triad)
- [ ] TimbreAgent selects from ≥6 archetypes via scoring, not static map
- [ ] Beat-level automation varies macro/filter on phrase slots
- [ ] Experiment 06 theory + riddim catalog updated with song-agent layer energy model
- [ ] Eval gates for chord density + timbre diversity
- [ ] `npm test` green per phase

---

## Phase map

| Phase | Name | Deliverable |
|-------|------|-------------|
| **116** | Poly voice pool | `VoicePool` in `LayerEngine`; `scheduleChord()` |
| **117** | Chord pattern IR | `bodyMidis[]`; PatternAgent multi-note; `voicingMode: triad\|spread` |
| **118** | Timbre scoring | `PresetArchetypeMeta` + `TimbreScoringAgent` |
| **119** | Layer energy docs | Theory updates + optional mix eval helpers |
| **120** | Beat automation | Phrase-slot macro/filter curves |
| **121** | Chord eval gates | Simultaneous-note metrics + golden tests |
