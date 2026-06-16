# Arrangement agent + procedural MIDI — research (cycle 8)

> **Date:** 2026-06-16 · GitHits + GSD phase 87  
> **Goal:** Pluggable procedural MIDI/pattern tools, hierarchical arrangement agents, and a **full song arrangement UI** that generates riddim tunes from rule packs and accepts downstream automation sub-agents.

---

## Executive summary

The repo already ships **SongDef v2**, multibus engine, riddim arrangement builder, mix agent (phase 2), and drum/sidechain (phase 3). The next leap is not more templates by hand — it is a **deterministic generation stack** with a **supervisor agent** and **specialist sub-agents**, each emitting Zod-validated artifacts behind `gate` fields.

**Recommended plug-ins (npm, MIT-safe):**

| Package | Role | Verdict |
|---------|------|---------|
| **`tonal`** (@tonaljs/*) | Key/scale/degree → note names & MIDI | **Adopt** — bass note pools, key-aware generation |
| **`@tonejs/midi`** | SMF ↔ JSON interchange | **Optional** — export/import, not runtime scheduler |
| **`@strudel/core`** | Tidal pattern algebra | **IR port only** — AGPL; no runtime embed (#76) |
| **Internal `lib/song/riddim/*`** | Halftime grids, mod profiles, sections | **Keep** — authoritative riddim rules |

**Do not embed** a full DAW, SuperCollider, or Strudel REPL. Compile everything to **SongDef** + existing multibus pipeline.

---

## GitHits evidence

### Procedural patterns & MIDI

| Source | Finding | Port |
|--------|---------|------|
| Tone.js `Pattern` + `PatternGenerator` (#110) | Cyclic value sequences (`up`, `down`, `random`) | `PatternDef` IR for note pools |
| `@tonejs/midi` (#111) | Binary MIDI → JSON tracks; 130k dl/mo | Optional `SongDef` export path |
| `@tonaljs/progression` + `Scale.degrees` (#112) | Key-aware note names from scale degrees | Bass `midi` generation in riddim key (F#) |
| Web Audio scheduling (#107) | `start(when)` on audio clock | Already in multibus scheduler |
| Strudel `@strudel/core` (#113) | Tidal `stack`/`cat`/`slow` semantics | Already mirrored in SongDef combinators |

### Sub-agent / orchestration patterns

| Source | Finding | Port |
|--------|---------|------|
| LangGraph prebuilt agents (#114) | Supervisor routes to specialists; structured state | `ArrangementRun` state object |
| Mix agent pipeline (#105) | analyze → propose → lint → apply | Template for every sub-agent |
| AGENTS.md gating (#115) | `auto` vs `human-review` on artifacts | All agent outputs carry `gate` |
| Cursor Task subagents (#116) | Parent spawns scoped workers with contracts | Dev-time only; runtime uses deterministic fns |

---

## Hierarchical agent model

```
┌─────────────────────────────────────────────────────────────┐
│  ArrangementAgent (supervisor)                               │
│  Input: ArrangementRequest { rulePackId, seed, bars, bpm }  │
│  Output: SongDef (gate: human-review default)               │
└───────────────┬─────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬──────────────┬──────────────┐
    ▼           ▼           ▼              ▼              ▼
 SectionAgent PatternAgent DrumAgent   AutomationAgent  MixAgent
 (structure)  (notes/MIDI) (drum lane) (mod CV keyframes) (MixDef)
    │           │           │              │              │
    └───────────┴───────────┴──────────────┴──────────────┘
                              │
                              ▼
                    merge + lintSong + hash
                              │
                              ▼
                     SongDef → multibus play / stems
```

### Sub-agent contract (all specialists)

Every sub-agent follows the **mix pass shape**:

```
Input (Zod) → deterministic transform → Output (Zod) → lint* → gate check → merge
```

| Sub-agent | Input schema | Output fragment | Lint |
|-----------|--------------|-----------------|------|
| **SectionAgent** | `SectionRulePack` | `sections[]` | bar bounds, muteLayers valid |
| **PatternAgent** | `PatternRequest` + key/bpm | `PatternEvent[]` per section | layer refs, beat overflow |
| **DrumAgent** | `DrumRulePack` | `drums: DrumLaneDef` | sampleId enum, sidechain |
| **AutomationAgent** | `ModProfileId` + section kind | `ModAutomation[]` | nodeId required, layer set |
| **MixAgent** | `SongDef` (existing) | `MixDef` | `lintMixDef` (shipped) |

**Supervisor responsibilities:**

1. Load rule pack (deterministic, versioned JSON)
2. Run sub-agents in **fixed order** (sections → patterns → drums → automation)
3. Merge fragments into one `SongDef`
4. `lintSong` + canonical `inputsHash`
5. Optionally invoke MixAgent post-merge (`gate: auto` only)
6. Emit `ArrangementRun` progress events for UI (red = working, blue = settled)

**AutomationAgent is a sub-agent of ArrangementAgent** — it never runs before pattern/section merge; it only adds `ModAutomation` keyframes on validated layer/node refs from the merged song.

---

## Procedural MIDI tools — integration options

| Option | Description | Recommendation |
|--------|-------------|----------------|
| **A. tonal-only** | Scale degrees → MIDI in PatternAgent | **Phase 88 MVP** |
| **B. tonal + euclidean** | Internal `euclideanRhythm(pulses, steps)` for hats/perc | Phase 88 |
| **C. @tonejs/midi export** | Render SongDef notes → SMF for external DAW | Phase 92 optional |
| **D. Strudel transpile** | Parse mini-notation subset → Pattern IR | Phase 93+ if AGPL reviewed |
| **E. LLM arrangement** | LLM proposes sections; Zod repair loop | `gate: human-review` only |

**MVP vertical slice (phase 88–91):**

- Rule pack `riddim-standard-16`
- PatternAgent: halftime sub/body notes from `tonal` degrees in F# minor pentatonic
- DrumAgent: existing `ensureRiddimDrums`
- AutomationAgent: existing `expandModProfile` per section kind
- UI: Generate → preview timeline → Play → Export SongDef

---

## Song arrangement UI (target)

Extends `PatchSongPanel` / new **Arrangement column**:

| Control | Behavior |
|---------|----------|
| Rule pack selector | `riddim-standard-16`, `riddim-sick-drop-32`, custom |
| Seed input | Reproducible `inputsHash` |
| Section timeline | Bars, mute layers, preset swaps (read-only until edit phase) |
| **Generate** | Runs ArrangementAgent; shows sub-agent progress |
| **Regenerate section** | Re-run Pattern+Automation for one section only |
| Apply mix pass | Existing mix sub-agent |
| Export | SongDef JSON, MixDef JSON, optional MIDI |

Progressive disclosure: generation controls above playback; section detail collapsible.

---

## Risks & gates

| Risk | Mitigation |
|------|------------|
| AGPL Strudel embed | IR port only; pin rule packs in repo |
| Agent non-determinism | LLM steps optional; default deterministic rule packs |
| UI scope creep | Ship generate + play before inline timeline editing |
| tonal bundle size | Tree-shake `@tonaljs/scale`, `@tonaljs/note` only |
| Sub-agent ordering bugs | Fixed pipeline + integration tests with golden SongDef hash |

---

## Phase map (87–93)

See `.planning/ROADMAP.md` milestone **Arrangement agents & song UI**.

| Phase | Focus |
|-------|-------|
| 87 | Research + agent Zod contracts + CONTEXT |
| 88 | `tonal` + PatternAgent + euclidean helper |
| 89 | ArrangementAgent orchestrator + `ArrangementRun` |
| 90 | AutomationSubAgent extraction + merge rules |
| 91 | Song arrangement UI (generate, progress, export) |
| 92 | Rule packs + regenerate-section + optional MIDI export |
| 93 | Tests, lesson 10, graph nodes |

---

## Sources

See `docs/research/sources.md` #110–116.
