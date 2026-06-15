# Changelog — Synthesis Learning Lab

> Release notes with **commit-hash traceability**. Each push juncture updates this file.
> Format: `short-hash` — conventional commit subject.
>
> **Convention:** `Publish tip` is the HEAD hash at push time. `Commit range` spans
> the logical commits in that publish (changelog bookkeeping included). The trace
> table lists feature commits only.

## [Unreleased]

_Nothing yet._

## 0.1.0 — 2026-06-15

Initial scaffold: docs, monorepo, shared libs, knowledge graph, experiment 01, stubs 02–06.

**Publish tip:** `6eac0c6`  
**Commit range:** `9ffbb11..6eac0c6`

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
