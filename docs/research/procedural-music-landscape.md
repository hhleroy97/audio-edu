# Procedural music landscape — repos, languages, and fit for audio-edu

> **Research phase 76** · Sources cited in `docs/research/sources.md` (#79–88).
> Goal: plan **full pre-generated riddim songs** (arrangement + timbre) inside Patch Lab / Web Audio stack.

---

## Executive summary

The ecosystem splits into three layers:

| Layer | Role | Best candidates |
|-------|------|-----------------|
| **Pattern / arrangement** | When notes fire, drum grid, sections | **Strudel**, TidalCycles, Sonic Pi |
| **Timbre / synthesis** | Bass growl, FX, layers | **Patch Lab** (Web Audio), SuperCollider, Serum via MIDI |
| **Render / export** | WAV/JSON song artifacts | OfflineAudioContext, Strudel `render`, Sonic Pi record |

**Recommendation for this repo:** Treat **Strudel’s pattern language** (JavaScript, Web Audio–friendly) as the **song compiler front-end**, and **Patch Lab presets + transport** as the **timbre back-end**. TidalCycles is the theoretical reference; Strudel is the browser-native implementation.

---

## Languages & repos (verified)

### Tier A — live-coding pattern languages (arrangement)

| Project | Repo | Language | Runtime | Why it matters |
|---------|------|----------|---------|----------------|
| **Strudel** | [tidalcycles/strudel](https://github.com/tidalcycles/strudel) → active dev on [codeberg.org/uzu/strudel](https://codeberg.org/uzu/strudel) | JS (Tidal DSL port) | Browser Web Audio / Tone.js | **No install**; mini-notation; `@strudel/web` npm package; riddim 140 BPM patterns in code |
| **TidalCycles** | [tidalcycles/Tidal](https://github.com/tidalcycles/Tidal) | Haskell | SuperDirt / SC | Canonical pattern algebra; `cps` cycles; MIDI to hardware |
| **Sonic Pi** | [sonic-pi-net/sonic-pi](https://github.com/sonic-pi-net/sonic-pi) | Ruby DSL | SuperCollider | Education-first; **built-in WAV record**; live loops |
| **FoxDot** | [Qirky/FoxDot](https://github.com/Qirky/FoxDot) | Python | SuperCollider | Linear “live loop” mental model |

**Pattern concept (Tidal/Strudel):** Music = functions over ** cyclic time** — `stack`, `cat`, `slow`, `fast`, Euclidean rhythms, polymetry. Riddim maps to `slow 2` (halftime feel) + `sound "bd:3 sn:4"` style samples or synth triggers.

### Tier B — score DSLs (notation, not always realtime)

| Project | Repo | Notes |
|---------|------|-------|
| **Alda** | [alda-lang/alda](https://github.com/alda-lang/alda) | Markup-like scores; **not Turing-complete** — generate Alda from Python/Clojure for algorithms (#81) |
| **ABC notation** | Various | Folk/trad; weak for electronic grids |
| **MusicXML / SMF** | — | Export targets, not procedural source |

### Tier C — synthesis engines (timbre)

| Project | Repo | Notes |
|---------|------|-------|
| **SuperCollider** | [supercollider/supercollider](https://github.com/supercollider/supercollider) | Backend for Tidal/Sonic Pi; deep DSP |
| **SuperDirt** | [mudclub/SuperDirt](https://github.com/mudclub/SuperDirt) | Sample/synth pool for Tidal |
| **Tone.js** | [Tonejs/Tone.js](https://github.com/Tonejs/Tone.js) | Strudel dependency; aligns with our stack |

### Tier D — meta / lists

| Resource | URL |
|----------|-----|
| **awesome-livecoding** | [toplap/awesome-livecoding](https://github.com/toplap/awesome-livecoding) |
| **Modulation Discovery (arXiv)** | Already in project — Serum patch = WT + filter + env (#11) |

---

## GitHits / Web Audio alignment

- **Web Audio API** (`webaudio/web-audio-api`): `AudioParam` additive modulation, `WaveShaperNode`, biquad filters — same contracts Patch Lab uses (#9, #10).
- **Strudel** ports Tidal mini-notation to JS — pattern queries map cleanly to **scheduled callbacks** (compare: our `transport` BPM + LFO sync).

---

## Mapping: “full pre-generated song” for riddim

A **pre-generated song** = frozen artifacts, not live REPL:

```
SongDef (Zod)
  ├── meta: { bpm: 140, key: "F#", bars: 32 }
  ├── sections: [ intro, drop, break, drop2 ]
  │     ├── pattern: Strudel source OR compiled Pattern IR
  │     └── patches: { bass: "pro-dual-lfo-growl", sub: "clean-sub" }
  └── render: { durationSec, sampleRate, wavPath? }
```

### Pipeline options

| Option | Pros | Cons |
|--------|------|------|
| **A. Strudel triggers Patch Lab** | Single browser stack; patterns drive `noteOn` + preset load | Need scheduler bridge; Strudel synth vs our graphs |
| **B. Strudel timbre + our presets via MIDI** | Strudel `@strudel/midi` → virtual CV to engine | MIDI port setup; more moving parts |
| **C. Compile patterns → JSON IR → internal scheduler** | Full Zod control; no Strudel runtime dep | Reimplement mini-notation subset |
| **D. Offline render only** | `OfflineAudioContext` + pattern timeline + graph snapshot | Heavy CPU; long renders |

**Recommended path (phased):** **C-lite → A → D**

1. Define **`SongPattern` IR** (bars, hits, preset id, mod automation keyframes) — validated Zod.
2. **Import** Strudel patterns via transpile or manual port of 2–3 riddim templates.
3. **Scheduler** in `lib/song/` fires Patch Lab engine at 140 BPM with halftime grid (phase 75 transport).
4. **Offline bounce** to WAV + graph JSON for reproducibility.

---

## Riddim-specific pattern idioms (from community + catalog)

| Idiom | Pattern idea | Patch Lab preset |
|-------|--------------|------------------|
| Halftime grid | Kick 1&3, snare 2&4 | Future `DrumLane` or Strudel samples |
| 1/4 wobble phrase | 4-bar loop, same CV motion | `subfiltronik-loop`, `hydraulic-press-wobble` |
| Drop swap | `cat` section A/B presets | Preset hot-swap via song IR |
| Sub+b body | Parallel triggers, sub no mod | `layerStack` + sub protection |
| Resample drop | Bounce 2 bars → sampler node | Phase 75 `recordResample` |

---

## Risks & gates

| Risk | Mitigation |
|------|------------|
| Strudel repo moved to Codeberg | Pin npm `@strudel/*` version; vendor pattern IR |
| Browser render length / memory | Chunked OfflineAudioContext renders per section |
| Scope creep (full DAW) | Ship **one** 16-bar riddim song template first |
| Licensing | Strudel AGPL — evaluate embed vs IR-only port |

---

## Related project artifacts

- `docs/research/riddim-sound-catalog.md` — timbre presets (cycle 4)
- `lib/patch/presets/riddim-archetypes.ts` — preset ids for song `patches` map
- `.planning/phases/76-procedural-song-generation/` — GSD research + plan

---

## SongDef schema (phase 77)

Validated in `lib/schemas/song.ts` — Strudel-inspired **Pattern IR** without runtime embed:

| Type | Fields | Role |
|------|--------|------|
| `SongMeta` | `id`, `title`, `bpm`, `key`, `bars`, `beatsPerBar`, `gate` | Reproducible song header |
| `PatchAssignment` | `layer`, `presetId`, `defaultMidi?` | Maps sub/body → Patch Lab preset |
| `PatternEvent` | discriminated `note` \| `preset` \| `gate` \| `automation` | Beat-grid triggers |
| `ModAutomation` | `beat`, `param`, `value`, `nodeId?` | CV keyframes (optional) |
| `SectionDef` | `startBar`, `endBar`, `events[]`, `patches?` | Intro / drop / break blocks |
| `SongDef` | `meta`, `patches[]`, `sections[]` | Full declarative song |

Example artifact: `songs/riddim-drop-01.json` (8 bars, `clean-sub` + `pro-dual-lfo-growl`).

Pipeline modules: `lib/song/validate-song.ts`, `scheduler.ts`, `render-offline.ts`, `templates.ts`.
