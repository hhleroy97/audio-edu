# AGENTS.md — Synthesis Learning Lab

> Rules and contracts for any agent (Cursor, Claude Code, Codex, etc.) working in this repo.
> Read `HANDOFF.md` first for project context, then `METADATA_SCHEMA.md` for exact field defs.

---

## 1. Prime directives

1. **`docs/` is the source of truth.** Never invent facts about synthesis. Ground every concept
   in a cited source inside the experiment's `docs/sources.md`. If you can't source it, flag it —
   don't fabricate it.
2. **Hard-wired output contracts.** Every structured artifact you produce (metadata, graph nodes,
   tutorial chunks) MUST validate against its Zod schema before being written. Same input shape →
   same output shape, every time. No free-form JSON.
3. **Build docs in parallel with code.** When you create or modify an experiment, update its
   `docs/` and `metadata.json` in the same change. Provenance is not optional.
4. **Surface your state.** Long-running work must emit progress so the UI can show the user what's
   happening (red = working, blue = settled). Never run silent.
5. **Respect the gates.** Honor the `gating` fields in `metadata.json`. Auto-generate only what is
   marked auto; anything marked `human-review` waits for approval.

---

## 2. Output contracts (Zod)

All agent-produced data passes through Zod validation. Define these in `lib/schemas/` and import
them everywhere. Reject + retry on validation failure; never write unvalidated output.

```ts
import { z } from "zod";

// Knowledge-graph node emitted per concept
export const GraphNode = z.object({
  id: z.string(),                       // stable slug, e.g. "fm-synthesis"
  label: z.string(),
  type: z.enum(["concept", "experiment", "technique", "component", "source"]),
  summary: z.string(),                  // plain-English, agent-readable
  experimentIds: z.array(z.string()),   // experiments that touch this node
  sources: z.array(z.string()),         // provenance — refs into docs/sources.md
});

// Edge between nodes (subject --predicate--> object)
export const GraphEdge = z.object({
  from: z.string(),
  to: z.string(),
  predicate: z.string(),                // e.g. "prerequisite-of", "uses", "modulates"
  confidence: z.number().min(0).max(1),
  evidence: z.string().optional(),      // span / quote-free reference supporting the edge
});

// A single micro-learning chunk
export const TutorialChunk = z.object({
  id: z.string(),
  experimentId: z.string(),
  concept: z.string(),
  title: z.string(),
  body: z.string(),                     // bite-sized lesson text
  estimatedMinutes: z.number(),
  prerequisites: z.array(z.string()),
  gate: z.enum(["auto", "human-review"]),
});
```

> If a field is missing or malformed, the agent must repair-and-revalidate, not pass it through.

---

## 3. Knowledge-graph extraction (Understand Anything pattern)

Two-stage pipeline, run over the experiments' `docs/`:

1. **Deterministic pass** — parse frontmatter, `metadata.json`, explicit links/tags. No LLM.
   This guarantees a reproducible structural backbone.
2. **LLM pass** — discover implicit relationships, extract entities/concepts, surface claims.
   Output MUST be `GraphNode` / `GraphEdge` objects (validated).

Write graph output to `/graph` (e.g. `.understand/`). Treat the deterministic backbone as
authoritative; LLM-discovered edges carry a `confidence` and are clearly separable.

---

## 4. Tutorial generation (gated)

- Pull from validated graph nodes + experiment `docs/`.
- Emit `TutorialChunk` objects — keep them genuinely bite-sized (micro-learning).
- Respect ordering: a chunk's `prerequisites` must already exist as nodes.
- `gate: "auto"` → publish; `gate: "human-review"` → stage for approval, do not publish.

---

## 5. UI / build conventions

- **shadcn/ui** for base components; **Magic UI** only for accent elements — stay minimal.
- **Progressive disclosure:** new experiments extend the prior experiment's control surface; do
  not rebuild layouts from scratch between experiments.
- **FFT display + spectrograph** are shared, reusable `lib/viz` components — wire them into every
  experiment from 01 onward.
- **3D (Three.js)** is a Phase-1 *stretch goal*. Ship 2D visualizations first; do not block on 3D.
- Honor the palette: deep dark purple base, hot red (working/warn), arctic blue (idle/done).

---

## 6. Definition of done (per experiment)

- [ ] `page.tsx` implemented, reusing `lib/audio` + `lib/viz` where possible.
- [ ] FFT + spectrograph wired in.
- [ ] `experiment.md` frontmatter complete & schema-valid.
- [ ] `metadata.json` complete & schema-valid (incl. backend tags + gating).
- [ ] `docs/` written: theory, architecture, sources (cited), changelog updated.
- [ ] Graph extractor runs clean and produces valid nodes/edges for the experiment.
- [ ] Agent-state feedback visible during any async work.

---

## 7. Hierarchical song agents (arrangement milestone)

Song generation uses a **supervisor + sub-agent** pipeline. Every agent output is Zod-validated
before merge. Sub-agents follow the same shape as the mix pass (`lib/song/mix/`):

```
Input (Zod) → propose/transform → lint → merge fragment → gate check
```

### Supervisor: `ArrangementAgent`

| Field | Contract |
|-------|----------|
| Input | `ArrangementRequest` (`lib/schemas/agents.ts`) |
| Output | `ArrangementRun` containing validated `SongDef` |
| Order | section → pattern → drum → automation → (optional) mix |
| Default gate | `human-review` on song; mix only when user applies |

### Sub-agents (specialists)

| Agent | Output fragment | Must lint |
|-------|-----------------|-----------|
| **SectionAgent** | `sections[]` | bar bounds, muteLayers |
| **PatternAgent** | `PatternEvent[]` | layer refs, beat overflow |
| **DrumAgent** | `drums: DrumLaneDef` | `DRUM_SAMPLE_IDS`, sidechain |
| **AutomationAgent** | `ModAutomation[]` | nodeId, layer — runs **after** merge target exists |
| **MixAgent** | `MixDef` | `lintMixDef` (existing) |

**AutomationAgent is subordinate to ArrangementAgent** — it must not run until section/pattern
fragments are merged into a draft `SongDef` so layer and node refs resolve.

### UI agent state

Emit `ArrangementAgentEvent` during runs. UI maps `phase: start` → red (working),
`phase: done` → arctic blue (settled). Never run silent on long generation passes.

### Schemas

- `lib/schemas/agents.ts` — `ArrangementRequest`, `ArrangementRun`, sub-agent events
- `lib/schemas/song.ts` — canonical `SongDef` artifact
- `lib/schemas/mix.ts` — mix sub-agent output

Research: `docs/research/arrangement-agent-landscape.md`
