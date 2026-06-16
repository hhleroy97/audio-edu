# Phase 87 — Arrangement agent + song UI (research)

**Status:** Research complete · **Next:** `/gsd-discuss-phase 87 --auto` then `/gsd-plan-phase 87`  
**Goal:** Procedural MIDI tooling + hierarchical arrangement agents + full song generation UI.

---

## Research questions

1. Which **npm libraries** can generate MIDI/note material deterministically in-browser?
2. How do we **avoid AGPL** while keeping Strudel-like expressiveness?
3. What **sub-agent structure** is robust enough for automation-under-arrangement?
4. What **UI surface** extends Patch Lab without a DAW rebuild?
5. What is the **MVP vertical slice** after multibus + mix + drums (81–86 + phase 3)?

---

## Findings

### Procedural tools (GitHits)

| Tool | License | Fit |
|------|---------|-----|
| `tonal` 6.4.x | MIT | Scale degrees, key → note/MIDI for bass patterns |
| `@tonejs/midi` 2.0.x | MIT | SMF import/export; not a generator |
| Tone.js `Pattern` | MIT | Reference for cyclic note pools |
| `@strudel/core` 1.2.x | **AGPL** | Semantics only — port to Zod IR |
| Internal riddim builders | — | Section kinds, mod profiles, drum grid (shipped) |

### Sub-agent patterns

- **LangGraph:** supervisor + specialist nodes with shared typed state
- **Mix pass (shipped):** analyze → propose → lint → apply — **canonical template**
- **AGENTS.md:** Zod validation + `gate` on every artifact

### UI

- Extend `PatchSongPanel` with arrangement column (rule pack, seed, generate, timeline readout)
- Agent state: red working / blue settled per sub-agent chip
- No inline piano roll in v1 — timeline is section bars + event counts

---

## Architecture decision

**Hybrid deterministic pipeline:**

```
ArrangementRequest (Zod)
  → SectionAgent → PatternAgent (tonal) → DrumAgent → AutomationAgent
  → merge SongDef → lintSong → optional MixAgent
  → UI play / export
```

No Strudel runtime. Optional `@tonejs/midi` export in phase 92.

---

## Open decisions (locked in 87-CONTEXT.md)

| # | Decision | Choice |
|---|----------|--------|
| 1 | First npm dep for generation | `tonal` (tree-shaken) |
| 2 | MIDI export | Phase 92 optional `@tonejs/midi` |
| 3 | LLM in arrangement | Off by default; human-review gate only |
| 4 | UI location | Patch Lab song mode — arrangement panel |
| 5 | Sub-agent order | sections → patterns → drums → automation → mix |

---

## Verification

- [x] GitHits pass on tonal, @tonejs/midi, Tone Pattern, Strudel license
- [x] Sub-agent hierarchy documented
- [x] `docs/research/arrangement-agent-landscape.md` written
- [x] Roadmap phases 87–93 added
- [x] AGENTS.md agent hierarchy section updated

---

## Sources

`docs/research/sources.md` #110–116 · `docs/research/arrangement-agent-landscape.md`
