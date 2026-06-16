# Song mix agent — phase 2 research

> **Research cycle 6** (2026-06-16): GitHits pass on Tone.js dynamics + Web Audio analysis patterns.  
> Implements deterministic mix pass on top of phase-1 mix strips (#103).

---

## Goal

Move from fixed mix defaults to **measured, reproducible MixDef artifacts**:

```
SongDef → offline stem analysis → proposeMixDef → lintMixDef → applyMixDef → engine
```

---

## GitHits evidence

| Source | Finding | Port |
|--------|---------|------|
| Tone.js `Limiter` (#104) | Fast attack (3 ms), ratio 20, threshold in dB | `MasterChain` limiter params in `MixDef.master` |
| Tone.js `Compressor` (#104) | Glue bus compression before limiter | `glueThreshold` / ratio in master chain |
| Web Audio `AnalyserNode` (#96) | Frequency/time analysis for metering | Windowed DFT centroid in `analyze-buffer.ts` |
| Riddim catalog (#19, #47, #93) | Sub/body/top frequency zones | Deterministic rules in `propose-mix.ts` |

---

## MixDef schema (`lib/schemas/mix.ts`)

| Type | Role |
|------|------|
| `StemMetrics` | RMS, peak, centroidHz per layer |
| `LayerMixAdjust` | busGain, songGain, hpfHz, lpfHz + rationale |
| `MasterMixAdjust` | inputGain, glue/limiter thresholds |
| `MixDef` | Full artifact with `analysis` provenance + `gate` |

---

## Deterministic agent rules (`propose-mix.ts`)

1. **Body masking sub** — centroid < 150 Hz and rms > 35% of sub → raise body HPF to ≥ 105 Hz  
2. **Body hot vs sub** — body rms > 75% sub rms → reduce busGain  
3. **Body peak** — peak > 0.82 → trim songGain + busGain  
4. **Top band** — centroid < 1800 Hz → raise top HPF to ≥ 2200 Hz  
5. **Master clip** — peak > 0.92 → lower master inputGain + tighten limiter  

All outputs pass `lintMixDef` (sub HPF forbidden, max bus gains by role).

---

## Pipeline modules

| Module | Path |
|--------|------|
| Buffer analysis | `lib/song/mix/analyze-buffer.ts` |
| Solo stem render | `lib/song/mix/render-solo-stem.ts` |
| Song analysis | `lib/song/mix/analyze-song.ts` |
| Mix agent | `lib/song/mix/propose-mix.ts` |
| Lint | `lib/song/mix/lint-mix.ts` |
| Apply | `lib/song/mix/apply-mix.ts` |
| Orchestrator | `lib/song/mix/mix-pass.ts` |

---

## UI

Patch Lab song panel: **Apply mix pass** (live engine) + **Export mix def** (offline analysis JSON).

---

## Next (phase 3)

Drum lane playback + sidechain ducking — largest jump toward “track” feel.
