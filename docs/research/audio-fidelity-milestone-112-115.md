# Audio fidelity & FX depth — milestone 112–115

> **Motivation:** Post-106–111 audit — generated songs still sound samey; bass
> ignores harmony pitch; synth buses lack send FX depth vs drum sends (#109).

---

## Root-cause analysis

| Symptom | Cause | Fix phase |
|---------|-------|-----------|
| Bass always same pitch | `AudioEngine.setActiveNoteHzAt` only updated LFO `noteHz`, not oscillator/FM `frequency` | **112** |
| Sub not tracking chords | PatternAgent used degree pool; sub now binds to `barSlots.rootMidi` | **114** |
| Flat / dry synth mix | Layer strip = EQ only; no parallel reverb/delay on synth buses | **113** |
| Presets feel identical | Fixed preset graphs + pitch bug masked harmony motion | 112 + 114 |

**Evidence:** `LayerEngine.scheduleNote` → `setNoteMidi` → `setActiveNoteHzAt` (pre-fix:
no generator frequency update). `clean-sub` preset hardcodes 55 Hz until runtime
`setParams({ frequency })` fires.

---

## Phase 112 — Pitch tracking on scheduled notes

**Deliverables:**
- `AudioEngine.propagateActiveNoteHz` — push `frequency` to oscillator/fm/wavetable nodes
- Tests: `tests/layer-pitch.test.ts`

**Commit:** `fix(audio): propagate MIDI pitch to generators on scheduled notes (phase 112)`

---

## Phase 113 — Synth send FX stack

**Deliverables:**
- `lib/song/multibus/synth-send-bus.ts` — shared reverb + dub delay + chorus return
- Per-layer send gain by mix profile (`SYNTH_SEND_DEFAULTS`)
- Body/top `LayerMixStrip` soft saturation (`tanh` waveshaper)
- `MasterBus.applyDefaultSynthSends()` on layer load

**Commit:** `feat(song): synth send FX bus + layer saturation (phase 113)`

**Sources:** #126 dub delay; #133 IR reverb; DSF dual-LFO motion (#134)

---

## Phase 114 — Harmony-locked sub pitch

**Deliverables:**
- PatternAgent: sub layer uses `barSlots[].rootMidi` directly from ChordVoicingAgent
- Eval: distinct sub midis ≥ 2 per drop (existing chord metrics)

**Commit:** `fix(song): lock sub pitch to bar chord roots (phase 114)`

---

## Phase 115 — Sound variety (future)

- Per-section preset morph via automation agent
- Detune spread from `MelodyDef`
- Body layer fifth voicing rotation per bar

---

## Definition of done

- [x] Scheduled notes change oscillator/FM frequency (112)
- [x] Drop sub MIDI varies with chord progression (114)
- [x] Body/top audible send reverb in Patch Lab preview (113)
- [x] `npm test` green (222 tests)

**Follow-on:** Chords still inaudible until poly voice pool + multi-note patterns — see
`docs/research/chords-polyphony-milestone-116-121.md` (phases 116–117).
