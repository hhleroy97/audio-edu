# Phase 117 — Chord pattern IR (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 117`  
**Depends on:** 116 (voice pool), 106 (ChordVoicingAgent)  
**Goal:** Pattern + harmony emit stacked body notes — audible dyads/triads in drops.

---

## Problem

`bodyDegrees[]` exists but `pickDegree()` emits one MIDI. `@tonaljs/voicing` never invoked.

## Schema

Extend `BarHarmonySlot`:

```ts
bodyMidis: z.array(z.number().int().min(0).max(127)).min(1).max(4)
```

Extend `HarmonyDef.voicingMode` with `"triad" | "spread"`.

## Agent changes

1. **ChordVoicingAgent** — `Voicing.get()` per bar → `bodyMidis` in bass register `F#1–C4`.
2. **PatternAgent** — body halftime hits: emit `bodyMidis.length` note events at same beat.
3. **MelodicPhraseAgent** — apply chops/timing to all voices in a chord stab (shared beat offset).

## Eval

- `minSimultaneousBodyNotes ≥ 2` when pack `voicingMode !== "root"`.

## Verification

- [ ] `riddim-standard-16` drop: FFT shows harmonics above fundamental on body hits
- [ ] Sub remains single note per hit
- [ ] Golden arrangement hash updated

**Parent:** `docs/research/chords-polyphony-milestone-116-121.md`
