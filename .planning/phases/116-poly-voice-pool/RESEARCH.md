# Phase 116 — Polyphonic layer voice pool (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 116`  
**Depends on:** 82 (LayerEngine), 112 (pitch tracking), 113 (synth sends)  
**Goal:** One layer can sound multiple notes at once — prerequisite for audible chords.

---

## Problem

`LayerEngine.scheduleNote` retunes a single `AudioEngine` graph. Overlapping body notes
cancel each other — only the last MIDI is heard.

## Recommended approach

**Voice pool (2–4 voices per layer):**

- Each voice = clone preset graph → shared `LayerMixStrip` input via per-voice trim gain.
- `scheduleNote(midi, t, dur)` → acquire voice from pool.
- `scheduleChord(midis[], t, dur)` → parallel acquire; release at `t + dur`.
- Steal policy: idle voice first, else oldest release time.

## Files to touch

- `lib/song/multibus/layer-engine.ts` — VoicePool wrapper
- `lib/song/multibus/audio-scheduler.ts` — optional batch chord dispatch
- `lib/patch/audio-engine.ts` — ensure `dispose()` safe for N instances
- `tests/layer-polyphony.test.ts` — 2 simultaneous midis → 2 active gates

## Out of scope

- MPE / per-note expression
- More than 4 voices per layer

## Verification

- [ ] Two `note` events same beat on `body` → two distinct frequencies audible
- [ ] Sub layer stays monophonic (pool size 1 for sub mix profile)
- [ ] Offline stem render unchanged for monophonic sections

**Parent:** `docs/research/chords-polyphony-milestone-116-121.md`
