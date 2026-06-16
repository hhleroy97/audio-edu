# Phase 87 — CONTEXT (discuss, auto mode)

> Locked decisions for planner and executor agents. Do not re-ask unless user overrides.

---

## Goal

Full **song arrangement UI** that generates riddim tunes from **predefined rule packs**, with **AutomationAgent** as a sub-agent of **ArrangementAgent** (runs after pattern/section merge). Outputs validate as `SongDef` and play through existing multibus engine.

---

## Locked decisions

### Libraries

1. Add **`tonal`** (MIT) in phase 88 for scale-degree → MIDI in PatternAgent.
2. **No `@strudel/core` runtime** — continue IR port in SongDef only.
3. **`@tonejs/midi`** deferred to phase 92 for optional export only.

### Agent hierarchy

```
ArrangementAgent (supervisor)
  ├─ SectionAgent      → sections[], mutes, combinator
  ├─ PatternAgent      → PatternEvent[] (tonal + internal grids)
  ├─ DrumAgent         → drums lane (existing riddim-drum-grid)
  ├─ AutomationAgent   → ModAutomation[] (expandModProfile)
  └─ MixAgent          → MixDef (existing runMixPass, optional post-step)
```

- Fixed execution order; merge then `lintSong`.
- Each sub-agent: Zod in/out, lint step, `gate` on output fragments where applicable.
- Default song `gate: human-review`; mix `gate: auto` only when user clicks apply.

### UI (phase 91)

- Extend Patch Lab song panel: rule pack, seed, Generate, sub-agent progress, section summary timeline.
- Regenerate single section = phase 92.
- No piano roll v1.

### Rule packs (phase 92)

- Start with `riddim-standard-16`, `riddim-sick-drop-16` ported to `ArrangementRulePack` JSON.
- Seed → deterministic `inputsHash` on SongDef meta.

### Out of scope (this milestone)

- Live Strudel REPL
- Full timeline editing / piano roll
- LLM arrangement (future, always human-review)
- SuperCollider / external synth

---

## Success criteria (phase 87)

- Research doc + sources committed
- ROADMAP 87–93 defined
- AGENTS.md documents agent contracts
- Ready for `/gsd-plan-phase 87`
