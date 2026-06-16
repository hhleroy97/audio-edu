# ROADMAP — Pro Modulation Milestone

> Milestone closes the gap between "tutorial bass" and producer-grade riddim patches.
> Execute with `/gsd-execute-phase` or manually phase-by-phase.

| Phase | Name | Goal | Commit tag |
|-------|------|------|------------|
| **71** | Bipolar CV & attenuation | Signed mod depth + offset on CV edges; schema + engine | `feat(patch): bipolar CV routing` |
| **72** | Live mod preview | Effective param readout when CV connected | `feat(patch): live mod preview on params` |
| **73** | Advanced LFO & macro | S&H, key-track rate, macro node, richer PeriodicWave | `feat(patch): macro node and advanced LFO` |
| **74** | Pro presets & verification | Dual-LFO growl presets, lesson 07, graph + UAT | `feat(patch): pro riddim presets and lesson 07` |
| **75** | Workflow P3 (stretch) | Resample node, scope descriptors, transport grid | `feat(patch): resample and analysis workflow` |

## Dependency graph

```
71 ──► 72 ──► 74
 │      │
 └─► 73 ──┘
              └──► 75 (optional)
```

## Definition of done (milestone)

- [ ] CV edge supports **bipolar depth** (−1…+1) and **offset** (attenuverter)
- [ ] Mod matrix UI shows depth, offset, bipolar toggle per route
- [ ] Knobs show **live effective value** when modulated (audio-nodes pattern)
- [ ] LFO: sample-hold shape + optional **key-tracked rate**
- [ ] **Macro** node fans one knob to N CV targets with per-target depth
- [ ] ≥3 new **pro presets** (dual-LFO growl, stutter wobble, macro demo) pass preset tests
- [ ] **Lesson 07** teaches mod matrix + dual LFO in guided flow
- [ ] `docs/research/riddim-feature-roadmap.md` Phase D marked shipped
- [ ] Knowledge graph supplement updated; `npm run graph:extract -- --force` clean
- [ ] `npm test` green

## Out of scope (later milestone)

- Chaos LFO (Serum Lorenz/Rossler)
- M/S matrix, spectral ducking node
- Full halftime arrangement grid with drum lanes
