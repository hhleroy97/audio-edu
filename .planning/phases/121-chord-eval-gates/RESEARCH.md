# Phase 121 — Chord density eval gates (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 121`  
**Depends on:** 117 (chord IR), 118 (timbre), 120 (beat automation)  
**Goal:** Evaluation catches “flat harmony” before human review.

---

## New metrics

| Metric | Function | Gate |
|--------|----------|------|
| `simultaneousBodyNotes` | max notes sharing beat in drops | ≥ 2 if voicingMode ≠ root |
| `archetypePresetCount` | unique body preset ids | ≥ 4 |
| `phraseMacroKeyframes` | automation events per drop | ≥ 4 |
| `chordSymbolChanges` | distinct `barSlots.chordSymbol` | ≥ 2 (existing partial) |

## Deliverables

- Extend `EvaluationRules` in `lib/schemas/harmony.ts`
- `evaluation-agent.ts` metrics
- Golden snapshots for `phrase-eval` + pack-riddim seeds
- `tests/chord-density-eval.test.ts`

## Verification

- [ ] Arrangement without polyphony fails eval when pack expects dyads
- [ ] `npm test` green

**Parent:** `docs/research/chords-polyphony-milestone-116-121.md`
