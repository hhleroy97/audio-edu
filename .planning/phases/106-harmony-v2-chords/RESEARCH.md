# Phase 106 — ChordVoicingAgent / Harmony v2 (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 106`  
**Depends on:** Phases 94 (HarmonyAgent), 100–105 (pipeline)  
**Goal:** Bar-aligned chord roots + bass-register voicings — fix “flat / no chords” output.

---

## Research questions

1. How do producers discuss bass **harmony** vs monophonic riddim roots (Reddit / forums)?
2. What tonal.js APIs support deterministic voicings without ML?
3. What schema changes are backward-compatible with existing `HarmonyDef`?
4. How should `PatternAgent` emit polyphony without breaking multibus scheduler?

---

## Community findings (Reddit proxies)

| Source | Finding | Agent port |
|--------|---------|------------|
| DSF riddim thread #134 | “Repetitive bass wobbles that hardly change” — variety via **preset/mod**, not pads | Pair with 110; harmony adds **root motion** |
| DSF `sleeps` | “Chord/piano melodies to **chop up**” | Voicing agent outputs roots; phrase agent chops (107) |
| Melodic dubstep #136 | Sub follows **chord roots**; drop alternates chord vs single-note | `voicingMode: "fifth"` default; `"triad"` on build |
| Theory Helper #137 | Progressions `i–VI–III–VII`, harmonic minor V→i | New rule-pack progressions |
| EDM Templates #135 | Frequency slotting > stacking random patches | Voicings stay in bass register only |

**Reddit access:** `r/synthrecipes`, `r/AudioSynthesis` — blocked direct fetch; DSF + indexed guides used (see `riddim-research-loop.md` cycle 3).

---

## tonal.js findings (local package audit)

GitHits unavailable (backend error). Verified from `node_modules/@tonaljs/voicing/README.md`:

- `Voicing.get(chord, range, dictionary, voiceLeading, lastVoicing)` — primary API
- `Voicing.search` — golden-test enumeration
- `Progression.fromRomanNumerals` — already in harmony-agent; extend to retain **chord symbol** per roman

**Proposed bass dictionary:**

```ts
{ "": ["1P 5P"], "m": ["1P 5P"], "m7": ["1P 5P 7m"], "sus4": ["1P 4P 5P"] }
```

**Range:** `["F#1", "C4"]` for F# minor packs.

---

## Code gaps

- `HarmonyAgent` → `subDegrees` / `bodyDegrees` only (max 2 scale degrees)
- `pickDegree` + `buildHalftimeGroove` → monophonic
- Rule packs: `minor pentatonic` limits color to 5 notes

---

## Schema proposal

Extend `HarmonyDef`:

- `voicingMode: "root" | "fifth" | "triad"`
- `barsPerChord: 1 | 2 | 4`
- `progression` using full minor key (`i`, `VI`, `III`, `VII`)
- Optional `scaleOverride` per pack

New `SectionHarmonyPlan.barChords[]` with `{ barOffset, chordSymbol, midiNotes[] }`.

Optional new event kind `chord` in song schema OR multiple `note` events same beat.

---

## Verification (research)

- [x] Community chord/chop guidance cited (#134–138)
- [x] tonal.js voicing API mapped
- [x] Backward-compatible schema sketched
- [x] Eval gates proposed (`minUniqueChordRoots`, `minBarChordChanges`)
- [x] Parent doc: `docs/research/song-depth-phases-106-111.md`

---

## Sources

`docs/research/sources.md` #134–138, #112
