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
