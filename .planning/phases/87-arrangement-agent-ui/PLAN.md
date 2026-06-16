# Phase 87–93 — Arrangement agents & song UI (plan stub)

**Depends on:** Multibus 81–86, mix agent phase 2, drums phase 3  
**Research:** `RESEARCH.md`, `87-CONTEXT.md`, `docs/research/arrangement-agent-landscape.md`

> **Next command:** `/gsd-plan-phase 87` to expand this stub into executable tasks.

---

## Goal

Procedural song generation from rule packs via supervisor + sub-agents, with full arrangement UI in Patch Lab.

---

## Wave breakdown

| Wave | Phase | Deliverable |
|------|-------|-------------|
| **Research + contracts** | **87** | Agent schemas, docs, roadmap (this phase) |
| **Pattern tools** | **88** | `tonal` integration, PatternAgent, euclidean helper |
| **Orchestrator** | **89** | `ArrangementAgent`, merge, `ArrangementRun` |
| **Automation sub-agent** | **90** | Extract mod expansion; post-merge only |
| **UI** | **91** | Generate, progress chips, section timeline |
| **Rule packs** | **92** | 2+ packs, regenerate-section, optional MIDI export |
| **Ship** | **93** | Lesson 10, tests, graph nodes |

---

## Phase 87 tasks (current)

1. [x] GitHits research — tonal, @tonejs/midi, Tone Pattern, Strudel license, LangGraph patterns
2. [x] `docs/research/arrangement-agent-landscape.md`
3. [x] `lib/schemas/agents.ts` — ArrangementRequest, ArrangementRun, events
4. [x] AGENTS.md §7 hierarchical agents
5. [x] ROADMAP 87–93, PROJECT.md milestone update
6. [ ] `/gsd-plan-phase 87` — detailed task breakdown for 88+

---

## Phase 88 preview (PatternAgent)

1. Add `tonal` dependency (confirm install with user)
2. `lib/song/agents/pattern-agent.ts` — scale degrees → PatternEvent[]
3. `lib/song/pattern/euclidean.ts` — internal euclidean rhythm helper
4. Tests: golden note lists for F# riddim key
5. Commit: `feat(song): PatternAgent with tonal scale generation`

---

## Phase 89 preview (ArrangementAgent)

1. `lib/song/agents/arrangement-agent.ts` — fixed pipeline, merge, lintSong
2. `runArrangement(request)` → `ArrangementRun`
3. Emit `ArrangementAgentEvent` for UI
4. Tests: deterministic hash for rule pack + seed
5. Commit: `feat(song): arrangement agent orchestrator`
