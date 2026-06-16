# Phase 76 — Procedural song generation (plan)

**Depends on:** Phases 71–75 (modulation + resample + transport)  
**Research:** `RESEARCH.md`, `docs/research/procedural-music-landscape.md`

---

## Goal

Ship a ** reproducible pipeline** from declarative song definition → scheduled Patch Lab performance → optional WAV export, starting with one riddim drop template.

---

## Wave breakdown

| Wave | Phase | Deliverable |
|------|-------|-------------|
| **Research** | **76** | Landscape doc, Zod sketch, architecture (this milestone) |
| **Schema** | **77** | `SongDef`, `PatternIR`, `SectionDef` in `lib/schemas/song.ts` |
| **Scheduler** | **78** | `lib/song/scheduler.ts` — bar/beat clock @ 140 BPM, preset swap |
| **Render** | **79** | Offline bounce + manifest; 8-bar MVP WAV test |
| **Product** | **80** | `/lab` song mode UI, 2 full song templates, lesson 08 stub |

---

## Phase 77 tasks (schema)

1. `lib/schemas/song.ts` — Zod:
   - `SongMeta`, `SectionDef`, `PatternEvent`, `PatchAssignment`, `ModAutomation`
2. `lib/song/validate-song.ts` — repair-on-fail
3. Example: `songs/riddim-drop-01.json` (8 bars, preset ids from catalog)
4. Tests: `tests/song-schema.test.ts`
5. Docs: `docs/research/procedural-music-landscape.md` § schema
6. Commit: `feat(song): Zod song definition schema for procedural riddim`

---

## Phase 78 tasks (scheduler)

1. `lib/song/scheduler.ts` — beat → callback; integrates `transportBpm`
2. Bridge: `triggerPatchNote(presetId, midi, duration)` on Patch Lab engine
3. Map pattern events → `setGeneratorKeyGate` + preset load
4. Tests: golden timeline for 1 bar
5. Commit: `feat(song): bar scheduler bridging patterns to Patch Lab`

---

## Phase 79 tasks (offline render)

1. `lib/song/render-offline.ts` — OfflineAudioContext + engine graph freeze
2. Reuse `recordFromScopeTap` pattern per section
3. Emit `song-manifest.json` (inputs hash, preset ids, duration)
4. CI test: render 2s smoke (headless jsdom skip → node with fake ctx if needed)
5. Commit: `feat(song): offline WAV render and manifest export`

---

## Phase 80 tasks (UX + templates)

1. `PatchSongPanel.tsx` — load song JSON, progress bar, play/render
2. Templates: `riddim-drop-minimal`, `riddim-drop-archetype-stack`
3. Lesson 08 stub — “Patterns vs patches”
4. Graph: `concept:algorithmic-composition`, `technique:pattern-scheduling`
5. Commit: `feat(song): riddim song templates and lab song mode`

---

## Verification (milestone 76–80)

```bash
npm test -- --run tests/song-*.test.ts
npm run build
# Manual: load riddim-drop-01.json → hear 8 bars → export WAV
```

---

## Out of scope

- Full Strudel REPL embed (AGPL review gate)
- SuperCollider server
- Stem mastering / LUFS normalization
- Automatic lyric/vocal generation
