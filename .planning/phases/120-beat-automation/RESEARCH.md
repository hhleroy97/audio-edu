# Phase 120 — Beat-aware automation (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 120`  
**Depends on:** 111 (RhythmPhraseDef), 90 (AutomationAgent), 117 (chords)  
**Goal:** Unique beats/sounds per phrase slot — tuned macro/filter curves, not one global profile.

---

## Problem

`expandModProfile()` fires the same keyframes for entire section. Phrase slots A/B/C/D
change drums but not synth automation.

## Deliverables

1. `BeatAutomationDef` in rule-pack schema (optional)
2. `runBeatAutomationAgent` — bar-index + phrase-slot keyed curves
3. Maps:
   - Slot A: baseline macro
   - Slot C (hat roll bar): +filter open, +send delay
   - Slot D (fill): body gate shorten for hydraulic chop
4. Chord-aware: triad bars → shorter `durationBeats` automation multiplier

## Synthesis basis

- Dual LFO half-rate (#64)
- Macro comb throw (#72)
- WT morph on drop B (#76)
- DSF chop chord samples (#134)

## Eval

- `minPhraseMacroKeyframes ≥ 4` per drop section

## Verification

- [ ] Phrase-eval seed: different automation values at bar 0 vs bar 3
- [ ] Deterministic hash stable

**Parent:** `docs/research/chords-polyphony-milestone-116-121.md`
