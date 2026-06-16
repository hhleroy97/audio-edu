# Changelog — Synthesis Learning Lab

> Release notes with **commit-hash traceability**. Each push juncture updates this file.
> Format: `short-hash` — conventional commit subject.
>
> **Convention:** Tag each publish (`git tag vX.Y.Z`). Record tag + commit range here.
> Resolve tip hash with `git rev-parse vX.Y.Z^{commit}`. Trace table = feature commits only.

## [Unreleased]

### Research & knowledge graph

- RIDDIM research sprint (cycles 1–3): `docs/research/riddim-research-loop.md`, sources #19–62
- Knowledge graph research pass: `graph/research/riddim-supplement.json` (14 techniques, 3 concepts, 18 edges)
- `mergeResearchSupplements()` in `graph/extract/research.ts`; extract script merges research JSON
- Updated `graph/index.md`, `riddim-synthesis.md` §6, `riddim-feature-roadmap.md` academic refs

### Pro modulation (Patch Lab phases 71–75)

- **Phase 71:** Bipolar CV depth (−1…+1), offset, unipolar legacy on mod matrix routes
- **Phase 72:** Live effective-value preview on CV-modulated filter/FM params
- **Phase 73:** Sample-hold LFO, key-tracked rate, macro CV node
- **Phase 74:** Four pro presets, lesson 07 mod matrix mastery
- **Phase 75:** Resample → sampler, spectral centroid on FFT, transport sync grid

### Research cycle 4 — gnarly archetype catalog

- **`docs/research/riddim-sound-catalog.md`** — 6 subsections, 13 playable archetypes
- Sources **#63–78** (DSF, PresetShare, CONMOD, NAS-FM, forums)
- Preset panel grouped by `RIDDIM_ARCHETYPE_SECTIONS`

## 0.4.0 — 2026-06-15

Patch Lab: React Flow node-graph canvas with live Web Audio routing and guided lesson 01.

**Publish tag:** `v0.4.0`  
**Commit range:** `v0.3.0..v0.4.0`

### Commit trace

| Hash | Subject |
|------|---------|
| `1e02d24` | docs: add UI overhaul handoff and prior-art provenance |
| `d34fa98` | build: add React Flow, zustand, nanoid, and react-joyride |
| `404bb65` | feat(patch): add Zod contracts, AudioEngine, and connection registry |
| `89f7fc5` | feat(patch): add zustand store and React Flow node components |
| `6aedcc4` | feat(viz): add labeled oscilloscope, spectrum, and spectrogram displays |
| `9cbb7ea` | feat(lab): add Patch Lab canvas with guided lesson 01 |
| `780305a` | docs: update UI-pass checklist for v0.4.0 patch lab |
| `5a02643` | fix(patch): disconnect audio nodes before reconnecting wires |

### Highlights

- `/lab` — modular-synth style patching (oscillator → analyser → output)
- AudioEngine reconciles React Flow edges to Web Audio `connect()` calls
- Prior art: xyflow Web Audio tutorial, synflow connection trees, plinth save model
- Analysis column with labeled oscilloscope, log FFT, and spectrogram
- Lesson 01 guided tour via react-joyride


Phase-one arc complete: experiments 03–06, micro-lesson loop, tutorial generator, graph watch.

**Publish tag:** `v0.3.0`  
**Commit range:** `v0.2.0..v0.3.0`

### Commit trace

| Hash | Subject |
|------|---------|
| `0594419` | feat(ui): add micro-lesson shell and experiment lesson loader |
| `3f3476a` | feat(lib): add envelope, wavetable, filter, and layer-mixer modules |
| `4dae790` | feat(03-pitch-envelopes): implement ADSR pitch envelope experiment |
| `32832ba` | feat(04-wavetable): implement wavetable morph experiment |
| `d840df1` | feat(05-filtering): implement subtractive filter experiment |
| `81c6f44` | feat(06-layering): implement multi-layer oscillator stack |
| `75d5fbd` | feat(experiments): wire micro-lessons into oscillator and unison pages |
| `7ff0506` | feat(graph): add tutorial generator, watch mode, and refreshed graph output |
| `59fa4cd` | docs: mark phase-one experiments complete and UI-pass ready |

### Highlights

- Micro-lesson shell: objectives + theory excerpt before every playground
- Experiments 03–06: pitch envelopes, wavetable morph, filtering, layering
- `lib/audio`: envelope, wavetable, filter, layer-mixer; matching viz components
- `npm run graph:watch` + `npm run tutorials:generate` (18 gated `TutorialChunk`s)
- Ready for UI pass — see `docs/UI-PASS.md`

## 0.2.0 — 2026-06-15

Install lockfile, frontmatter parser fix, experiment 02 unison, extracted knowledge graph.

**Publish tag:** `v0.2.0`  
**Commit range:** `v0.1.0..v0.2.0`

### Commit trace

| Hash | Subject |
|------|---------|
| `7ed7759` | build: add package-lock.json from dependency install |
| `4bbb186` | fix(graph): parse YAML frontmatter arrays, objects, and block scalars |
| `453657e` | feat(lib): add unison voice stack and waveform overlay visualization |
| `03c1a18` | feat(02-unison): implement unison and detuning experiment |
| `4ef2578` | chore(graph): extract deterministic knowledge graph for six experiments |

### Highlights

- `package-lock.json` — reproducible installs; build and tests verified
- Frontmatter parser handles `[]`, nested `compatibility`, and `summary >` blocks
- Experiment 02: detuned voice stack, stereo spread, waveform overlay
- Knowledge graph output: 6 experiments, 171 deterministic edges

## 0.1.0 — 2026-06-15

Initial scaffold: docs, monorepo, shared libs, knowledge graph, experiment 01, stubs 02–06.

**Publish tag:** `v0.1.0`  
**Commit range:** `9ffbb11..v0.1.0`

### Commit trace

| Hash | Subject |
|------|---------|
| `9ffbb11` | docs: add project vision, agent contracts, and metadata schema |
| `c1b6e76` | build: scaffold Next.js monorepo with TypeScript and Tailwind |
| `74c3889` | feat(lib): add Zod schemas, audio, visualization, and UI toolkit |
| `e1d251a` | feat(graph): add deterministic knowledge-graph extractor |
| `6322026` | feat(app): add lab shell, experiment index, and graph viewer |
| `31c24ad` | feat(01-oscillator): implement oscillator experiment with provenance docs |
| `bc5d001` | feat(experiments): stub phase-one arc experiments 02 through 06 |
| `561d00e` | test: add graph extractor and metadata validation tests |

### Highlights

- Project docs: `HANDOFF.md`, `AGENTS.md`, `METADATA_SCHEMA.md`
- Shared `lib/audio`, `lib/viz`, `lib/ui`, `lib/schemas` (Zod contracts)
- Understand Anything–style deterministic graph extractor + `npm run graph:extract`
- Experiment 01 (oscillator) fully interactive with FFT + spectrograph
- Experiments 02–06 stubbed with theory, architecture, sources, changelog
- Vitest tests for graph extraction and metadata validation

### Publish ritual (ongoing)

1. Land logical commits (`docs:`, `feat:`, `test:`, etc.)
2. Update this file — version section, tag, range, trace table
3. `git tag -a vX.Y.Z` on publish tip · `git push && git push --tags`
