# Song generation phases 94–99 — research & implementation

> **Date:** 2026-06-16 · GSD phases 94–99  
> **Goal:** Musically richer deterministic song generation — harmony pools, groove variation, transitions, quality gates, MIDI/sample export, and golden verification.

---

## Executive summary

Phases 87–93 shipped a **supervisor + rule packs + Pattern/Drum/Automation** stack. Phases 94–99 extend that pipeline with four new sub-agents and two export/verification paths. All outputs remain **Zod-validated** and **seed-deterministic**.

| Phase | Agent / deliverable | Key files |
|-------|---------------------|-----------|
| **94** | HarmonyAgent — roman progression → per-section degree pools | `lib/schemas/harmony.ts`, `harmony-agent.ts` |
| **95** | GrooveAgent — ghost snares, euclidean hats, cat phrases | `groove-agent.ts` |
| **96** | TransitionAgent — pre-drop body dip, build filter sweep | `transition-agent.ts` |
| **97** | EvaluationAgent — quality gates + `maxEvalRetries` | `evaluation-agent.ts` |
| **98** | MIDI export + sample drum registry | `lib/song/export/midi-export.ts`, `sample-registry.ts` |
| **99** | Golden snapshots + rule-pack JSON viewer in Patch Lab | `golden-snapshots.ts`, `PatchSongPanel.tsx` |

---

## Pipeline order (post-94)

```
SectionAgent → HarmonyAgent → PatternAgent → TransitionAgent
  → GrooveAgent → DrumAgent → AutomationAgent → EvaluationAgent → lintSong
```

Evaluation failures trigger re-runs up to `ArrangementRequest.maxEvalRetries` (default 2).

---

## Phase 94 — HarmonyAgent

**Research:** `@tonaljs/progression` `Progression.fromRomanNumerals`, `Scale.degrees` (#112).

**Rule-pack field:** `harmony: HarmonyDef` — roman progression, sub/body octaves, optional `kindOffsets` per section kind.

**Output:** `SectionHarmonyPlan[]` consumed by PatternAgent for scale-degree MIDI instead of a static root.

---

## Phase 95 — GrooveAgent

**Research:** Euclidean rhythms (Bjorklund), Strudel `cat` IR (#113), riddim ghost-snare pocket (#91).

**Rule-pack field:** `groove: GrooveDef` — ghost snare offbeat, hat euclidean `{pulses, steps}`, `enableCatPhrases`.

**Output:** Extra drum hits + phrase splits merged into drum lane and section combinators.

---

## Phase 96 — TransitionAgent

**Research:** UKF Infekt arrangement guide (#94), existing `layerGain` / mod automation (#99).

**Rule-pack field:** `transition: TransitionDef` — `preDropBodyDipBeats`, `buildFilterSweep`.

**Output:** Body gain keyframes before drop boundaries; optional filter frequency sweep on build tails.

---

## Phase 97 — EvaluationAgent

**Research:** Extend `lintSong` + mix metrics (#105); golden hash regression.

**Rule-pack field:** `evaluation: EvaluationDef` — `minDropNotes`, `minDrumHits`, `minDropSections`.

**Output:** `EvaluationReport` — pass/fail with metrics; supervisor retries on failure.

---

## Phase 98 — MIDI + samples

**Research:** `@tonejs/midi` SMF encode (#111); Web Audio `AudioBuffer` sample playback (#107).

**Deliverables:**
- `songToMidiBuffer` / `songToMidiBlob` — note + GM drum map export
- `sample-registry.ts` — optional WAV paths per `sampleId`; `DrumEngine.setSampleBuffer()`

---

## Phase 99 — Golden snapshots + UI

**Deliverables:**
- `GOLDEN_ARRANGEMENT_SNAPSHOTS` — per rule-pack seed specs with minimum counts
- Patch Lab: rule-pack JSON viewer, Export MIDI button, expanded agent progress chips

---

## Sources

See `docs/research/sources.md` #117–122.
