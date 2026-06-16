# Phase 76 — Procedural song generation (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 76` or execute PLAN.md  
**Goal:** Understand procedural / live-coding ecosystems and choose a path to **pre-generated full riddim songs** in Patch Lab.

---

## Research questions

1. Which **language** is the industry/algorave standard for pattern-level composition?
2. Which repos run **in the browser** without SuperCollider install?
3. How do we connect **patterns** (when) to **patches** (how it sounds)?
4. What **Zod contracts** do we need for reproducible song artifacts?
5. What is the **minimal vertical slice** (one 8-bar drop)?

---

## Findings

### The language you remembered

Most likely **TidalCycles** (often called “Tidal”) — a Haskell embedded DSL for cyclic patterns. **Strudel** is the JavaScript port that runs in browser at [strudel.cc](https://strudel.cc/) (development also on Codeberg `uzu/strudel`).

Others: **Sonic Pi** (Ruby), **FoxDot** (Python), **Alda** (score markup + external codegen), **SuperCollider** (DSP engine).

### Repo shortlist (stars / relevance)

| Repo | Stars (order of mag.) | Fit |
|------|----------------------|-----|
| sonic-pi-net/sonic-pi | 10k+ | Education; offline WAV record |
| tidalcycles/strudel | 2k+ | **Best browser fit** |
| tidalcycles/Tidal | 2k+ | Reference semantics |
| supercollider/supercollider | 5k+ | Backend; heavy |
| alda-lang/alda | 6k+ | Score DSL; not realtime grid |
| toplap/awesome-livecoding | curated | Discovery |

### GitHits evidence

- `webaudio/web-audio-api` — WaveShaper + Biquad AudioParam model matches Patch Lab CV (#9).
- `tidalcycles/strudel` — indexed; use npm docs + mini-notation examples for IR design.

### Academic

- arXiv:2510.06204 — mod discovery on Serum bass (already project source #11).
- CONMOD arXiv:2406.13935 — LFO phaser/flanger (mod FX node validation).

---

## Architecture recommendation

**Hybrid: Strudel-inspired pattern IR + Patch Lab render**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  SongDef (Zod)  │────►│ Pattern scheduler  │────►│ Patch Lab engine│
│  sections/bars  │     │ 140 BPM, halftime  │     │ preset graphs   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                            │
                                                            ▼
                                                   OfflineAudioContext
                                                   → WAV + manifest JSON
```

**Do not** embed full SuperCollider in v1. **Do** reuse phase 75 transport grid + resample + 35 presets.

---

## Vertical slice (MVP song)

- **8 bars @ 140 BPM** halftime
- **Layers:** `clean-sub` (root only) + `pro-dual-lfo-growl` body
- **Pattern:** kick/snare sample placeholders OR Strudel `s()` triggers
- **Output:** `song-manifest.json` + optional 16-bit WAV
- **Human gate:** `gate: human-review` on published song chunks

---

## Open decisions (for discuss phase)

| # | Question | Default |
|---|----------|---------|
| 1 | Embed `@strudel/web` vs port mini-notation subset? | Port subset → Zod IR (AGPL-safe) |
| 2 | Drums: samples vs synth clicks? | Samples in `/public/samples/riddim/` |
| 3 | Song UI: new `/song` route vs extend `/lab`? | `/lab` “Song mode” tab |
| 4 | Graph nodes for `concept:algorithmic-composition`? | Yes, supplement in phase 77 |

---

## Verification (research)

- [x] ≥5 repos documented with URLs
- [x] Browser-native path identified (Strudel)
- [x] Mapping to existing Patch Lab presets
- [x] `docs/research/procedural-music-landscape.md` written
- [x] Risks + MVP scope stated

---

## Sources

See `docs/research/sources.md` #79–88.
