# Phase 74 — Pro Presets, Lesson 07 & Verification

**Goal:** Ship producer-reference patches + guided lesson; close milestone with UAT and roadmap updates.

**Depends on:** Phases 71–73

---

## Tasks

### 1. Pro presets (`lib/patch/presets/index.ts`)

| ID | Description | Techniques |
|----|-------------|------------|
| `pro-dual-lfo-growl` | LFO1 cutoff + LFO2 FM index, distortion, OTT | fm-growl, wobble, ott |
| `pro-stutter-wobble` | Custom + sampleHold LFO, bipolar depth | wobble-lfo-cutoff |
| `pro-macro-wobble` | Macro → cutoff + FM index | macro, layer-stack |
| `pro-metallic-comb` | FM + comb modFx + formant sweep | comb-metallic, fm-growl |

Each: validate against `PatchPreset` schema; `techniqueTags` aligned with graph.

### 2. Lesson 07 — Mod matrix mastery (`lib/patch/lessons/lesson-07-mod-matrix.ts`)

Steps:

1. Explain CV vs audio ports (diagram: `envelope-pipeline`)
2. Patch LFO → filter; adjust bipolar depth
3. Add second LFO → FM index with rateRatio half
4. Load `pro-dual-lfo-growl`; reflect on scope
5. Unlock macro node in palette

Wire in `lib/patch/lessons/index.ts` + `LabClient` progression after lesson 06 equivalent.

### 3. Feature roadmap update

`docs/research/riddim-feature-roadmap.md`:

- Add **Phase D — Pro modulation** table marking 71–74 items ✅
- Update executive summary "gap today" → modulation infra complete; P3 workflow remains

### 4. Research loop

`docs/research/riddim-research-loop.md` — Cycle 4: implementation outcomes + preset A/B homework

### 5. Tests

- `tests/patch-lessons.test.ts` — lesson 07 schema
- `tests/patch-presets.test.ts` — 4 new presets playable graph validation
- Full `npm test`

### 6. Nyquist / UAT checklist (`.planning/phases/74-pro-presets-verification/UAT.md`)

- [ ] `pro-dual-lfo-growl` audible at 140 BPM with transport running
- [ ] Negative mod depth inverts wobble
- [ ] Macro moves two params simultaneously
- [ ] Sub layer unchanged when modulating body only (`layerStack`)
- [ ] Lesson 07 completable end-to-end in `/lab`

### 7. Graph & tutorials

- Run graph extract
- Optional: `graph/tutorials/chunks.json` — one `TutorialChunk` for mod matrix (gate: human-review)

---

## Verification

```bash
npm test
npm run graph:extract -- --force
npm run validate:metadata  # if lesson metadata touched
```

---

## Commit

```
feat(patch): pro riddim presets, lesson 07 mod matrix, and Phase D roadmap.

Delivers reference patches and guided flow so learners reach producer-grade modulation density in Patch Lab.
```

## Milestone tag (after 74)

Optional git tag: `v0.5.0-pro-mod` — update CHANGELOG with release section.
