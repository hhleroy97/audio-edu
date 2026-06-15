# HANDOFF.md — Synthesis Learning Lab

> Single source of truth for the project vision, architecture, and Phase One build plan.
> Hand this directly to Cursor (or any coding agent) alongside `AGENTS.md` and `METADATA_SCHEMA.md`.

---

## 1. What we're building

A **web-based sound-synthesis learning lab**: a collection of small, focused, interactive
experiments that teach sound design from the ground up, organized around **RIDDIM / dubstep
synthesis** as the motivating theme.

It is **not** one monolithic app. It is a monorepo of bite-sized experiments that share a
common audio + UI toolkit. As the library grows, the experiments become **nodes in a knowledge
graph**, which in turn powers **micro-learning tutorials** delivered in small chunks.

### Guiding philosophy
> *Ignite curiosity by making invisible systems visible.*

Every experiment should expose what's actually happening to the sound — spectra, envelopes,
waveforms — not hide it behind knobs.

### The core loop the learner experiences
```
micro-lesson  →  playground  →  micro-lesson  →  playground  →  ...
(ingest)         (experiment)    (ingest)         (experiment)
```
Each lesson teaches one concept with visual feedback, then unlocks a playground to mess with it
freely. UIs use **progressive disclosure** — each experiment layers new controls on top of the
previous one's interface, so the learner is never re-oriented from scratch.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js** (App Router) | Monorepo, each experiment is a route |
| Audio | **Web Audio API** + **Tone.js** | Tone for fast prototyping, raw WebAudio where control is needed |
| UI kit | **shadcn/ui** | Base components |
| Motion / flair | **Magic UI** | Accent/“magic” elements only — keep it minimal |
| 3D (stretch) | **Three.js** | 3D harmonic/layer visualizations — *Phase 1 stretch goal* |
| Schema validation | **Zod** | Hard-wire agent I/O contracts so outputs are always the same shape |
| Knowledge graph | **Understand Anything** pattern (`Egonex-AI/Understand-Anything`) | Deterministic parser + LLM agents to extract concepts & implicit relationships |

### Repo shape
```
/
├─ app/                      # Next.js routes
│  └─ experiments/
│     └─ 01-oscillator/      # one folder per experiment
│        ├─ page.tsx
│        ├─ experiment.md    # YAML frontmatter + theory  (see METADATA_SCHEMA.md)
│        ├─ metadata.json    # backend tags for agents     (see METADATA_SCHEMA.md)
│        └─ docs/            # theory, architecture, sources, changelog
├─ lib/
│  ├─ audio/                 # shared synthesis utilities (oscillators, envelopes, filters)
│  ├─ viz/                   # FFT, spectrograph, waveform, envelope, 3D renderers
│  └─ ui/                    # shared shadcn-based components + agent-state indicators
├─ graph/                    # knowledge-graph output (.understand/ etc.)
├─ HANDOFF.md
├─ AGENTS.md
└─ METADATA_SCHEMA.md
```

### `docs/` as source of truth
Each experiment keeps a **robust `docs/` folder** — theory, architecture notes, sources, and a
changelog. This is what the knowledge-graph agents read. Build the docs **in parallel** with the
experiment, never retrofit them. Provenance matters: every claim/concept should trace to a source.

---

## 3. Phase One — the RIDDIM sound-design arc

Focus: synthesizing RIDDIM-style sounds (punchy, modulated, metallic basses & textures), with
FM synthesis as a recurring technique. Sequence is roughly linear but experiments can **bundle**
shared tools so they're reusable.

| # | Experiment | Teaches | New UI layered on top |
|---|---|---|---|
| 01 | **Oscillator basics** | Waveforms, frequency, amplitude | Waveform selector, freq slider, amp slider, **FFT display**, **spectrograph** |
| 02 | **Unison & detuning** | Voice stacking, detune, stereo spread | Voice-count, detune amount, spread — + waveform overlay |
| 03 | **Pitch envelopes** | ADSR shaping pitch over time | Envelope curve editor + live curve viz |
| 04 | **Wavetable modulation** | Morphing timbre / harmonic content | Wavetable position morph + real-time waveform preview |
| 05 | **Filtering** | Cutoff, resonance, subtractive shaping | Cutoff + resonance, **frequency-response curve**, FFT shows removed frequencies |
| 06 | **Layering** | Stacking oscillators w/ own envelopes & filters | Multi-layer stack view, layered waveforms (z-depth → 3D stretch) |

**Phase Two (later):** mixing & effects — levels, panning, sends, FX chains. Layering (06) is the
bridge into it, intentionally taught *before* mixing.

### Always-on visualizations
- **FFT frequency diagram** — present across experiments; the core "make it visible" element.
- **Spectrograph** — frequency over time.
- Concept-specific: waveform overlays (unison), envelope curves (pitch env), morph preview
  (wavetable), response curve (filter), stacked/3D waveforms (layering).
- **3D (Three.js) — stretch goal:** harmonics as a 3D landscape, layers in z-depth. Ship 2D first.

---

## 4. Aesthetic & brand

**Direction:** dark-mode brutalism with a "new-age CLI" feel — techy, blocky, sharp lines, lots of
negative space. Mean but calculated, a little dirty/grungy. Minimal, built to appeal to creatives.

### Palette — "hot and cold"
| Role | Color | Use |
|---|---|---|
| Base | Deep dark purple (near-black) | Backgrounds, surfaces |
| Hot accent | Red | Agent activity, warnings, "working" states |
| Cold accent | Arctic / icy blue | Stable / idle / completed states |

> Tune exact hex values during the design pass — the *relationship* (deep purple base, hot-red vs
> arctic-blue tension) is the locked decision.

### Agent transparency (non-negotiable UX rule)
The agent does as much work as possible, **but the user must never be left wondering**. Surface
agent state continuously — what it's doing, progress, when it's done — using the hot/cold accent
language (red = working, blue = settled).

---

## 5. Knowledge graph & automation

Adopt the **Understand Anything** pattern from day one:
- A **deterministic parser** extracts explicit structure (frontmatter, tags, wikilinks, file/function/dep relationships).
- **LLM agents** then surface implicit relationships, concepts, and claims, building a navigable graph.

Here the "code" being mapped is **audio concepts + experiments**. The graph feeds:
1. Visual exploration of how concepts connect.
2. Auto-generated micro-learning tutorials, sliced into bite-sized chunks.

Generation is **gated** (see `metadata.json` gating fields): some resources auto-generate,
others require a human review gate before publishing.

---

## 6. Build order

1. Lock `METADATA_SCHEMA.md` (frontmatter + `metadata.json`) — **do this first.**
2. Scaffold the Next.js monorepo + `lib/audio`, `lib/viz`, `lib/ui`.
3. Build Experiment 01 (oscillator basics) with FFT + spectrograph as the reusable viz baseline.
4. Write its `docs/` in parallel; validate that the knowledge-graph extractor reads it.
5. Layer 02 → 06, reusing tools and progressively disclosing UI.
6. Wire up the graph + gated tutorial generation.
7. Stretch: Three.js 3D visualizations.
