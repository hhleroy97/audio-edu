# Riddim mix robustness — research & GSD plan (phases 100–105)

> **Date:** 2026-06-16 · Deep research loop (GitHits + arXiv + producer web)  
> **Goal:** Generated songs that **sound and groove like proper riddim mixes** — richer drums/rhythm, deeper synth/mod/FX leverage, and **visible generation progress** so completion is obvious in Patch Lab.

---

## Executive summary

Phases 94–99 added harmony, groove variation, transitions, evaluation, MIDI export, and golden snapshots. The pipeline is **structurally complete** but still **sonically thin**:

| Gap today | Why it feels “not riddim” | Highest-leverage fix |
|-----------|---------------------------|----------------------|
| Drum grid is 4 hits/bar (kick×2 + 1 snare) | Missing riddim **bounce kicks** on 2 & 4, layered clap+snare, 2-bar A/B variation | **Phase 101** — `RiddimPocketDef` + pocket v2 |
| Procedural synth clicks, no default WAV pack | Thin transients vs layered 808/TR909 stacks | **Phase 102** — sample pack + `SampleDrumAgent` |
| Song uses 2 presets (`clean-sub`, `hydraulic-press-wobble`) | Catalog has 18 archetypes; drops B/C never swap timbre | **Phase 103** — `TimbreAgent` + 3-layer rule packs |
| Mod profiles on body only; no top/FX sends | Infekt “constant motion”, tearout comb, snare verb missing | **Phase 104** — `ModFxAgent` + drum/synth sends |
| Sync `runArrangement()` + chip flash | All sub-agents finish in one tick — UI cannot show stages | **Phase 105** — yield + `ArrangementPipelineStepper` |

**Recommended GSD order:** 105 first (UX unblock) → 101–102 (rhythm + drums) → 103–104 (sound + modulation). UX first because it makes every later phase testable in the lab.

---

## Current baseline (code audit)

### Rhythm / drums

`buildRiddimDrumGrid()` (`lib/song/drums/riddim-drum-grid.ts`):

- Kick on beats **0 & 2** only (halftime)
- Single snare ghost on beat **1**
- No quiet **bounce kicks** on 2 & 4 (EDMProd riddim signature #125)
- No 2-bar loop A/B (Studio Brootle #126)
- No micro-timing swing (Sample Focus ghost snares #127)

`GrooveAgent` adds euclidean hats + optional ghost snare — but the **core pocket** stays static.

### Synth / modulation

- `DEFAULT_RIDDIM_LAYERS`: **sub + body** only — no **top fizz** layer (#19, #47)
- Rule packs assign one `modProfileId` per drop section; 7 profiles exist in `mod-schemas.ts` but only 2 are wired
- `AutomationAgent` expands keyframes to body/top layers — top layer often absent in generated songs
- Patch Lab **already ships** FM, distortion, formant, modFx (phaser/comb), multiband OTT, mod matrix (P0–P2 ✅) — the gap is **song pipeline not selecting them**

### Generation UX

- `runArrangement()` is **synchronous**; `onProgress` fires in one JS turn
- `PatchSongPanel` maps `latestAgentPhase` from events — React never paints intermediate states
- `AgentStateIndicator` (`lib/ui/AgentStateIndicator.tsx`) exists with progress bar — **not used** in song panel
- `generateBusy` clears in `finally` immediately — no distinct **“complete ✓”** settled state

---

## Research findings

### 1. Riddim / dubstep rhythm (producer web)

| Source | Finding | Port to schema |
|--------|---------|----------------|
| [EDMProd riddim guide](https://www.edmprod.com/how-to-make-riddim/) (#125) | Kick on 1 **and** quiet kick on 2 & 4 = “whack”; layered clap + snare; hat on every kick (−9 dB) | `bounceKick: { enabled, velocity }`, `snareLayers[]` |
| [Sample Focus 140 BPM](https://blog.samplefocus.com/blog/everything-you-need-to-know-about-140-bpm/) (#127) | Ghost snares v30–50; kicks on 2.5/3.5; **velocity evolution** bar-to-bar | `GrooveDef.swingMs`, `velocityJitter` |
| [Studio Brootle dubstep patterns](https://www.studiobrootle.com/dubstep-drum-patterns/) (#126) | 2-bar loops; double-time hats at bar end; dub delay on snare send | `phraseLengthBars: 2`, `barFill: "double-hats-tail"` |
| GitHits Strudel IR (#118) | `bd(3,8)`, polymeter `stack`, `sometimesBy` ghost velocity | Extend `GrooveAgent` — already IR-ported, not pocket core |

### 2. Symbolic rhythm / arrangement (arXiv)

| Paper | Relevance | Deterministic port (no ML embed) |
|-------|-----------|----------------------------------|
| [arXiv:2408.15176](https://arxiv.org/abs/2408.15176) REMI-z / drum arrangement (#128) | Drum patterns span **4-bar segments**; model must respect phrase boundaries | `RhythmPhraseDef` — 4-bar template slots per section kind |
| [arXiv:2408.01696](https://arxiv.org/html/2408.01696) fine-grained rhythm discriminator (#129) | Rhythm quality = velocity + bar-relative timing | EvaluationAgent metrics: `velocityStdDev`, `ghostSnareCount` |
| [arXiv:2402.14285](https://arxiv.org/html/2402.14285) rule-guided diffusion (#130) | Non-differentiable **rule gates** for generation | Extend `EvaluationDef` with rhythm rules (already have lint pattern) |
| [arXiv:2409.08155](https://arxiv.org/pdf/2409.08155) GraphMuGen (#131) | Phrase → structure hierarchy | SectionAgent already structural; add **phrase combinator** per 4 bars |

### 3. Synth / FX leverage (GitHits + existing catalog)

| Source | Finding | Port |
|--------|---------|------|
| Tone.js `Player` / `Sampler` (#132) | `load(url)` → `AudioBuffer` for drum layers | Wire `sample-registry.ts` to multibus drum engine |
| Tone.js `Convolver` (#133) | IR reverb on snare send | `DrumSendDef.reverbMix` on drum lane |
| `docs/research/riddim-sound-catalog.md` | 18 presets across 6 vibe sections | `TimbreAgent` maps `section.kind` → `{ subPresetId, bodyPresetId, topPresetId }` |
| `RIDDIM_MOD_PROFILES` | 7 profiles (hydraulic, dual-lfo-fm, infekt, tearout, comb-top…) | `ModFxAgent` assigns profile + **top** profile per section from rule pack |
| arXiv:2510.06204 modulation discovery (#11) | ~98% Serum bass uses multi-target LFO | Already in Patch Lab — expose via **preset rotation** in song layers |

### 4. Generation progress UX (AGENTS.md + LangGraph #114)

| Pattern | Implementation |
|---------|----------------|
| **Surface your state** (AGENTS.md §4) | Emit `ArrangementAgentEvent` **between** sub-agents with `await yieldToUi()` |
| Supervisor stepper (LangGraph #114) | Ordered steps with `phase: start \| lint \| done \| error` — extend with `stepIndex / totalSteps` |
| Existing `AgentStateIndicator` | Red pulse = working, blue = settled; progress bar = `stepIndex / N` |
| Completion affordance | After last agent `done`: hold **settled** banner 2s; disable generate until acknowledged optional |

**Root cause:** synchronous pipeline. Fix with `runArrangementAsync()` using `queueMicrotask` or `setTimeout(0)` between agents so React can paint.

---

## GSD phases 100–105

### Phase 100 — Research ✅ (this document)

**Deliverable:** Research doc + sources + ROADMAP. No runtime code.

**Commit:** `docs(research): riddim mix robustness phases 100-105`

---

### Phase 101 — Riddim pocket v2 + swing (`RhythmAgent`)

**Goal:** Core drum grid matches producer riddim pocket, not generic halftime.

**Schema** (`lib/schemas/rhythm.ts`):

```ts
RiddimPocketDef = {
  bounceKick: { enabled, velocity: 0.35 },      // beats 2 & 4
  mainSnareBeat: 1,                              // halftime anchor
  ghostSnares: { beats: [3], velocity: 0.28 },  // optional
  phraseBars: 2,                                 // A/B bar variation
  barBVariant: "extra-bounce" | "hat-roll" | "none",
  swingMs: 8,                                    // micro-timing offset
}
```

**Agent:** Refactor `DrumAgent` + extend `GrooveAgent` OR new `RhythmAgent` that merges pocket + extras before `DrumAgent`.

**Rule-pack:** Add `rhythm: RiddimPocketDef` to `ArrangementRulePack`.

**Evaluation:** `minBounceKicks`, `phraseVariationBars` in `EvaluationDef`.

**Tests:** Golden snapshot expects ≥N bounce kicks per drop.

**Commit:** `feat(song): Riddim pocket v2 + swing (phase 101)`

**Sources:** #125, #126, #127, #118

---

### Phase 102 — Sample drums + layered snares (`SampleDrumAgent`)

**Goal:** Real transients; clap+snare stack like EDMProd layering.

**Deliverables:**

- `/public/samples/riddim/` — kick/sub, clap, snare, hat (CC0 or project-recorded; document license in `docs/sources.md`)
- `DrumLayerDef` — `{ sampleId, velocity, gain, microShiftMs }[]` per hit slot
- `SampleDrumAgent` — resolves registry paths; `DrumEngine` plays layered `Tone.Player` per hit (#132)
- Fallback to procedural when sample missing (current behavior)

**Evaluation:** `requireSamples: boolean` gate for golden tests (procedural fallback OK in dev).

**Commit:** `feat(song): sample drum layers + riddim WAV pack (phase 102)`

**Sources:** #107, #111, #132, #125

---

### Phase 103 — TimbreAgent + 3-layer rule packs

**Goal:** Each section gets appropriate **sub / body / top** presets from the archetype catalog.

**Schema:**

```ts
TimbreDef = {
  bySectionKind: {
    intro:  { sub: "clean-sub", body: "subfiltronik-loop", top: null },
    drop:   { sub: "clean-sub", body: "hydraulic-press-wobble", top: "full-stack-gnarl-top" },
    break:  { sub: "clean-sub", body: null, top: null },
  },
  dropBBodySwap: "harsh-square-fm",  // sick-drop pack
}
```

**Agent:** `TimbreAgent` after `HarmonyAgent` — outputs `LayerPlan[]` merged into `SongDef.layers` + section `bodyPresetId` overrides.

**Rule packs:** Add third **top** layer with noise/formant preset; rotate body on drop-b (#103 catalog).

**Tests:** Assert drop-b uses different `presetId` than drop-a for sick-drop pack.

**Commit:** `feat(song): TimbreAgent + 3-layer rule packs (phase 103)`

**Sources:** riddim-sound-catalog §1–§6, #19, #47, #112

---

### Phase 104 — Mod/FX depth (`ModFxAgent`)

**Goal:** Constant motion, tearout throws, snare space — use shipped Patch nodes via automation.

**Deliverables:**

- Extend `ArrangementRulePack` with `modFx: ModFxDef` — per-section `{ bodyProfileId, topProfileId, drumSendReverb }`
- Wire all 7 `RIDDIM_MOD_PROFILES` + assign `macro-comb-top-stab` on build/outro
- `ModFxAgent` supersedes thin `AutomationAgent`-only path OR runs after it (merge keyframes)
- Drum send: snare → short reverb + 2/16 delay (#126) via multibus send gain automation
- `EvaluationAgent`: `minModKeyframesPerDrop`, `topLayerActiveInDrop`

**Commit:** `feat(song): ModFxAgent + drum/synth sends (phase 104)`

**Sources:** #35, #68, #71, #126, mod-schemas.ts

---

### Phase 105 — Generation progress pipeline UI

**Goal:** User always sees **which sub-agent is running** and **when generation finished**.

**Deliverables:**

1. **Schema** — extend `ArrangementAgentEvent`:
   ```ts
   stepIndex: z.number().int().optional(),
   totalSteps: z.number().int().optional(),
   runPhase: z.enum(["running", "complete", "failed"]).optional(),
   ```
2. **Async runner** — `runArrangementAsync(req, onProgress)` yields between agents (`await nextFrame()`)
3. **UI** — `ArrangementPipelineStepper` component:
   - Vertical or horizontal step list (AGENT_ORDER)
   - Active step: red pulse (`AgentStateIndicator`)
   - Done steps: arctic blue
   - Progress bar: `stepIndex / totalSteps`
   - **Complete banner** when `runPhase === "complete"` (blue, non-pulsing, persists until next generate)
4. **PatchSongPanel** — replace chip-only display; keep `generateBusy` true until async resolves
5. **Tests:** Mock timer; assert event order + stepIndex monotonic

**Commit:** `feat(lab): arrangement pipeline stepper + async progress (phase 105)`

**Sources:** AGENTS.md §4, #114, `AgentStateIndicator.tsx`

---

## Dependency graph

```
100 (research)
  └── 105 (progress UX) ──► testability for all below
        ├── 101 (pocket v2) ──► 102 (samples)
        ├── 103 (timbre / 3-layer)
        └── 104 (mod/FX depth) ── depends on 103 top layer
              └── EvaluationAgent metrics extended each phase
```

**Parallelizable:** 101+103 after 105; 102 after 101; 104 after 103.

---

## Evaluation extensions (cross-cutting)

Inspired by arXiv:2408.01696 (#129) — rule-based, not ML:

| Metric | Gate | Phase |
|--------|------|-------|
| `bounceKickCount` | ≥ 4 per 8-bar drop | 101 |
| `velocityStdDev` | > 0.05 (not robotic) | 101 |
| `sampleHitRatio` | ≥ 0.8 when samples enabled | 102 |
| `uniqueBodyPresets` | ≥ 2 in sick-drop pack | 103 |
| `modKeyframesInDrop` | ≥ 4 | 104 |
| `pipelineEventCount` | = 2 × agents (start+done) | 105 |

---

## Definition of done (milestone 100–105)

- [ ] Riddim pocket includes bounce kicks + 2-bar variation + optional swing
- [ ] Optional WAV drum layers with procedural fallback
- [ ] Generated songs use ≥3 archetype presets across sections (sub/body/top)
- [ ] Drop sections carry mod profiles on body **and** top where rule pack specifies
- [ ] Patch Lab shows live sub-agent step during generate; clear **complete** state
- [ ] Golden snapshots + `npm test` green; docs + sources updated per phase

---

## What NOT to do (scope guard)

- **No Strudel runtime embed** — IR port only (#113, AGPL)
- **No ML drum model** — REMI-z (#128) informs **4-bar phrase templates**, not neural inference
- **No LLM rule-pack authoring** — deferred until EvaluationAgent rhythm metrics exist (phase 106+ backlog)
- **No resample node** — P3 #16; separate milestone unless bundled in 104 as stretch

---

## Suggested first `/gsd-plan-phase`

**Phase 105 (progress UI)** — smallest schema change, immediate UX win, unblocks validating 101–104 in the lab.

Then **Phase 101 (pocket v2)** — biggest perceptual groove jump for deterministic code.

---

## Sources

See `docs/research/sources.md` #123–133.
