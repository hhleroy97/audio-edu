# ROADMAP — Procedural Song Generation Milestone

> Previous milestone (phases 71–75): **shipped** — pro modulation, resample, transport grid.  
> Execute with `/gsd-plan-phase` / `/gsd-execute-phase` or Agent mode.

## Completed — Pro modulation (71–75)

| Phase | Name | Status |
|-------|------|--------|
| 71 | Bipolar CV & attenuation | ✅ |
| 72 | Live mod preview | ✅ |
| 73 | Advanced LFO & macro | ✅ |
| 74 | Pro presets & lesson 07 | ✅ |
| 75 | Workflow P3 | ✅ |

---

## Active — Procedural songs (76–80)

| Phase | Name | Goal | Commit tag |
|-------|------|------|------------|
| **76** | Research & architecture | Landscape doc, RESEARCH.md, path decision | `docs(research): procedural music landscape` |
| **77** | Song schema (Zod) | `SongDef`, `PatternIR`, example JSON | `feat(song): Zod song definition schema` |
| **78** | Pattern scheduler | Beat clock → Patch Lab preset/note triggers | `feat(song): pattern scheduler for Patch Lab` |
| **79** | Offline render | WAV + manifest export | `feat(song): offline song render pipeline` |
| **80** | Song mode & templates | Lab UI, 2 riddim songs, lesson 08 | `feat(song): riddim song templates and lab mode` |

## Dependency graph

```
76 (research) ──► 77 ──► 78 ──► 79 ──► 80
                      │
                      └── uses presets from riddim-archetypes + pro pack
```

## Definition of done (milestone 76–80)

- [ ] `SongDef` validates in Zod; example 8-bar riddim drop JSON
- [ ] Scheduler fires preset assignments at 140 BPM halftime
- [ ] Offline render produces WAV + manifest (reproducible)
- [ ] Lab “song mode” loads template and plays end-to-end
- [ ] Docs + graph updated; `npm test` green

## Out of scope

- Full Strudel REPL / AGPL embed without legal review
- SuperCollider install path
- Auto-mastering / streaming distribution
