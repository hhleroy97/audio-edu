# ROADMAP — Synthesis Learning Lab

> Execute with `/gsd-plan-phase` / `/gsd-execute-phase` or Agent mode.

---

## Completed — Pro modulation (71–75)

| Phase | Name | Status |
|-------|------|--------|
| 71 | Bipolar CV & attenuation | ✅ |
| 72 | Live mod preview | ✅ |
| 73 | Advanced LFO & macro | ✅ |
| 74 | Pro presets & lesson 07 | ✅ |
| 75 | Workflow P3 | ✅ |

---

## Completed — Procedural songs v1 (76–80)

| Phase | Name | Status |
|-------|------|--------|
| 76 | Research & architecture | ✅ |
| 77 | Song schema (Zod) | ✅ |
| 78 | Pattern scheduler (setTimeout MVP) | ✅ |
| 79 | Offline render + manifest | ✅ (placeholder bounce) |
| 80 | Song mode & templates | ✅ |

**Known gap (drives 81–86):** single `loadPreset()` graph — layers cannot sound simultaneously; scheduler uses wall-clock timers.

---

## Active — Multibus riddim songs (81–86)

| Phase | Name | Goal | Commit tag |
|-------|------|------|------------|
| **81** | Multibus research | GitHits landscape, architecture | `docs(research): multibus song engine landscape` |
| **82** | Layer engine | Parallel preset graphs → master bus | `feat(song): multibus layer engine` |
| **83** | Audio scheduler | `AudioContext.currentTime` + per-layer gates | `feat(song): audio-clock multibus scheduler` |
| **84** | Song IR v2 | Layers, drums, combinators, strict lint | `feat(song): SongDef v2 layers and lint` |
| **85** | Riddim arrangements | 3 multibus templates (16–32 bars) | `feat(song): multibus riddim arrangement templates` |
| **86** | Stems & lesson 09 | Offline stems, UI v2, graph | `feat(song): stem render and multibus song UI` |

## Dependency graph

```
76–80 (shipped v1)
  └── 81 (research)
        └── 82 ──► 83 ──► 84 ──► 85 ──► 86
                    │
                    └── uses riddim-archetypes + clean-sub + catalog §1–§5
```

## Definition of done (milestone 81–86)

- [x] Sub + body play **simultaneously** through master bus (no mid-song `loadPreset`)
- [x] Scheduler uses audio clock; per-layer gates (no global timer collision)
- [x] SongDef v2 validates; lint rejects bad preset refs and timeline overflows
- [x] ≥3 riddim templates with intro/drop/break/section variation
- [x] Stem manifest + offline master WAV from multibus render
- [x] Lesson 09; docs + graph; `npm test` green

## Out of scope

- Tone.js / Strudel runtime embed
- SuperCollider server
- Full DAW / MIDI export
- Auto-mastering / LUFS

---

## Active — Arrangement agents & song UI (87–93) ✅

| Phase | Name | Goal | Commit tag |
|-------|------|------|------------|
| **87** | Agent research | GitHits procedural MIDI + sub-agent hierarchy | `docs(research): arrangement agent landscape` |
| **88** | PatternAgent + tonal | Scale-degree note generation, euclidean helper | `feat(song): PatternAgent with tonal` |
| **89** | ArrangementAgent | Supervisor merge pipeline + ArrangementRun | `feat(song): arrangement agent orchestrator` |
| **90** | AutomationSubAgent | Mod profile expansion as sub-agent | `feat(song): automation sub-agent` |
| **91** | Arrangement UI | Generate, progress, section timeline in Patch Lab | `feat(lab): song arrangement UI` |
| **92** | Rule packs | Regenerate-section, optional @tonejs/midi export | `feat(song): arrangement rule packs` |
| **93** | Lesson + graph | Lesson 10, integration tests, graph nodes | `feat(lab): lesson 10 arrangement agents` |

## Active — Robust song generation (94–99) ✅

| Phase | Name | Goal | Commit tag |
|-------|------|------|------------|
| **94** | HarmonyAgent | Roman progression → section degree pools | `feat(song): HarmonyAgent + harmony schema` |
| **95** | GrooveAgent | Ghost snares, euclidean hats, cat phrases | `feat(song): GrooveAgent` |
| **96** | TransitionAgent | Pre-drop body dip, build filter sweep | `feat(song): TransitionAgent` |
| **97** | EvaluationAgent | Quality gates + auto-regen retries | `feat(song): EvaluationAgent + pipeline retries` |
| **98** | MIDI + samples | @tonejs/midi export, sample drum registry | `feat(song): MIDI export + sample drum registry` |
| **99** | Golden + UI | Snapshot suite, rule-pack JSON viewer | `feat(lab): golden snapshots + rule pack viewer` |

### Shipped after 81–86 (unnumbered)

| Work | Status |
|------|--------|
| Mix agent phase 2 (MixDef pass) | ✅ |
| Drums + sidechain phase 3 | ✅ |

## Dependency graph (87–99)

```
81–86 + mix(2) + drums(3) (shipped)
  └── 87 (research + agent schemas)
        └── 88 ──► 89 ──► 90 ──► 91 ──► 92 ──► 93
                    │
                    └── 94 Harmony ──► 95 Groove ──► 96 Transition
                              └── 97 Evaluation ──► 98 MIDI/samples ──► 99 Golden/UI
                    │
                    └── AutomationAgent subordinate to ArrangementAgent
                    └── MixAgent optional post-step (existing runMixPass)
```

## Definition of done (milestone 87–93) ✅

- [x] Generate full SongDef from rule pack + seed (deterministic hash)
- [x] Sub-agents emit Zod-valid fragments; supervisor merges + lintSong
- [x] AutomationAgent runs only after pattern/section merge
- [x] UI shows sub-agent progress and plays generated song
- [x] ≥2 rule packs; optional MIDI export
- [x] Lesson 10; docs + graph; `npm test` green

## Definition of done (milestone 94–99) ✅

- [x] HarmonyAgent maps roman progression to per-section degree pools
- [x] GrooveAgent adds ghost snares / euclidean hats without breaking determinism
- [x] TransitionAgent applies pre-drop dips and build filter sweeps
- [x] EvaluationAgent gates output; supervisor retries on failure
- [x] MIDI export + optional sample drum registry
- [x] Golden snapshot suite; rule-pack JSON viewer in Patch Lab

---

## Planned — Riddim mix robustness (100–105) ✅

> Research: `docs/research/riddim-mix-robustness-phases-100-105.md`  
> **Executed:** Phase 105 first (progress UI), then 101–104.

| Phase | Name | Goal | Commit tag |
|-------|------|------|------------|
| **100** | Research | GitHits + arXiv + producer web synthesis | `docs(research): riddim mix robustness phases 100-105` |
| **101** | Riddim pocket v2 | Bounce kicks, 2-bar A/B, swing ms, rhythm eval gates | `feat(song): Riddim pocket v2 + swing` |
| **102** | Sample drums | WAV pack + layered clap/snare; clap sample id | `feat(song): sample drum layers + riddim WAV pack` |
| **103** | TimbreAgent | 3-layer presets from archetype catalog per section | `feat(song): TimbreAgent + 3-layer rule packs` |
| **104** | Mod/FX depth | ModFxAgent, top profiles, drum reverb/delay sends | `feat(song): ModFxAgent + drum/synth sends` |
| **105** | Progress UI | Async pipeline + ArrangementPipelineStepper | `feat(lab): arrangement pipeline stepper + async progress` |

### Definition of done (milestone 100–105) ✅

- [x] Riddim pocket: bounce kicks + 2-bar variation + optional swing
- [x] Optional WAV drum layers with procedural fallback
- [x] ≥3 archetype presets across generated sections (sub/body/top)
- [x] Drop mod profiles on body and top; drum send FX
- [x] Live sub-agent stepper during generate; clear complete state
- [x] Golden snapshots + `npm test` green per phase
