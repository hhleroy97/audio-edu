# RIDDIM Sound Catalog — gnarly archetypes for Patch Lab

> **Research cycle 4** (2026-06-16): GitHits (Web Audio API waveshaper/filter specs), arXiv (CONMOD, NAS-FM, modulation discovery), DSF Community / PresetShare / Preset Drive / Audiotool forums as Reddit proxies.
>
> Every archetype below maps to a **playable preset** in `lib/patch/presets/riddim-archetypes.ts` and cites `docs/research/sources.md`.

---

## How to use this catalog

1. Pick a **subsection** by vibe (groove vs screech vs yoi).
2. Load the preset id in `/lab` → Run → play at **140 BPM** with transport synced LFOs.
3. Tweak via **mod matrix** (bipolar depth, macro fan-out) — phases 71–75 tooling.
4. **Resample** a 2 s loop (transport panel) and drop a sampler node for Subtronics-style iteration (#55).

**Rule:** Sub layer stays clean (no wobble CV on protected sub paths). Body carries motion; top adds fizz.

---

## §1 Groove Core — “hydraulic press” pocket

*Repetitive 1/4 halftime wobbles; Subfiltronik / early riddim minimalism.*

| Preset | Signal flow | Theory | Sources |
|--------|-------------|--------|---------|
| `hydraulic-press-wobble` | Saw → LP wobble (1/4 tri) → hard clip | Slow body 80–400 Hz; distortion adds mid harmonics without touching sub | #2, #63 |
| `subfiltronik-loop` | FM → LP wobble @ 1/4; static phrase | FM wobble “hardly changes” — genre-defining repetition | #64, #11 |
| `triplet-offgrid-wobble` | Square → LP @ **1/8T** | Triplet/dotted LFO = off-grid riddim groove | #2, #65 |

**Producer notes (DSF):** Riddim emphasizes **1/4 LFO** vs brostep complexity; Virtual Riot/Barely Alive hybrids add second LFO at half rate on FX (#64).

**Patch Lab knobs:** Negative mod depth inverts wobble; `sampleHold` shape = stepped “hydraulic” stutter.

---

## §2 FM Aggression — growl, screech, constant motion

*Virtual Riot / Barely Alive / tearout-adjacent FM; academic FM index envelopes (DDX7 #46, NAS-FM #67).*

| Preset | Signal flow | Theory | Sources |
|--------|-------------|--------|---------|
| `harsh-square-fm` | Square FM + dual LFO (cutoff + index) + clip | DSF: square + FM from B; LFO on cutoff, FM amount, volume | #64, #58 |
| `pitch-screech-pluck` | Pitch env → FM index; HP-ish filter | Fast pitch drop + high FM = neuro screech pluck; keep body above sub | #6, #66 |
| `infekt-constant-motion` | FM → phaser → LP; dual LFO | Infekt: bass must **never sit static** — phaser + dual mod routes | #35, #68 |

**arXiv grounding:** Modulation Discovery (#11) finds LFO→filter + LFO→wavetable in ~98% of Serum “Bass (Hard)” presets; DDX7 (#46) validates time-varying FM index from pitch/loudness.

**Patch Lab experiment:** Enable **key-track** on LFO; FM index live readout when CV connected.

---

## §3 Vocal / Formant — yoi, talk, vowel motion

*Formant peaks mimic vowels; French/German LP in Serum ≈ our formant bank.*

| Preset | Signal flow | Theory | Sources |
|--------|-------------|--------|---------|
| `yoi-talk-wobble` | Saw → formant (vowel O) + dual LFO (vowel + cutoff) | Dual resonant peaks = vocal “yoi”; same LFO rate family on both | #1, #2, #69 |

**Community:** Preset Drive yoi uses two band-pass peaks modulated together (#69). Wobble bass “vocal quality” = resonance 30–40% at 200–400 Hz cutoff (#70).

---

## §4 Metallic Mod FX — comb, phaser, DSF allpass chain

*Comb = regularly spaced notches (CONMOD #71); phaser = allpass bank.*

| Preset | Signal flow | Theory | Sources |
|--------|-------------|--------|---------|
| `dsf-allpass-comb` | FM → phaser (~20 Hz) → comb; slow LFO on index | DSF forum chain: volume LFO → allpass ~2–5% → comb/flanger (#64) | #59, #71 |
| `vr-comb-macro-throw` | Macro → FM index + comb depth | PresetShare “Complex Riddim”: macro comb tuning + FM (#72) | #72, #73 |

**arXiv:** CONMOD (#71) — flanger/comb as feedforward delay → comb filter; LFO rate + feedback are primary controls. Mitcheltree DAFx 2023 (#74) — LFO extraction for phaser/flanger.

**GitHits:** Web Audio `WaveShaperNode.curve` + `BiquadFilterNode` Q/cutoff AudioParams (#9, #10) — same additive CV model Patch Lab uses.

---

## §5 Layer Stack — reese body & three-band gnarl

*Sub/body/top split; phase-aware layering (#47).*

| Preset | Signal flow | Theory | Sources |
|--------|-------------|--------|---------|
| `reese-riddim-body` | Saw → detune → LP wobble; key-track LFO | Reese = detuned body; Transmission reese + key-track filter (#49) | #49, #19 |
| `full-stack-gnarl` | FM + noise → layerStack; S&H on FM index | Sub/body/top bands; S&H LFO = stutter on body only | #19, #55 |

**Mix rule:** HP body @ 80–100 Hz; sub sine mono; top noise HPF >2 kHz (#2, #47).

---

## §6 Tearout Hybrid — screech sustain & WT morph extremes

*Riddim–tearout merge (#73); resample iteration (#55).*

| Preset | Signal flow | Theory | Sources |
|--------|-------------|--------|---------|
| `tearout-screech-sustain` | FM (high index) → comb → hard clip → LP | Tearout: stacked distortion + comb + detune/FM (#73, PresetShare) | #73, #75 |
| `wt-morph-riddim` | WT position LFO + cutoff LFO + soft clip | WT morph @ tempo = timbre shift without new notes (#1, #76) | #1, #76 |

**Serum 2 note:** WT-as-LFO curve (#76) — conceptually similar to our **custom LFO curve** + `sampleHold`; full WT→LFO import is future work.

**Workflow:** Bounce → sampler → chop (#55, #16 resample node).

---

## §7 Movement systems (cross-cutting)

Techniques that apply across presets after phases 71–75:

| System | Patch Lab feature | Producer parallel |
|--------|-------------------|-------------------|
| Dual LFO chain | Two LFOs → cutoff + FM index | DSF half-rate second LFO on FX (#64) |
| Macro fan-out | Macro CV → multiple targets | PresetShare macro comb/FM (#72) |
| Bipolar depth | Mod matrix −1…+1 | Serum attenuverter (#11) |
| Key-track LFO | LFO rate × note/110 Hz | Reese tutorials (#49) |
| S&H stutter | `sampleHold` LFO shape | Square/custom stutter (#2) |
| Live mod readout | Effective cutoff/FM display | Vital/Serum mod viz (#53) |

---

## §8 Academic quick-reference (new cycle)

| ID | Paper | Riddim relevance |
|----|-------|------------------|
| #67 | NAS-FM (arXiv:2305.12868) | Auto FM architecture — explains why manual FM ratio/index tuning is hard |
| #71 | CONMOD (arXiv:2406.13935) | Comb/flanger = LFO-driven notches; validates modFx node design |
| #74 | Mitcheltree DAFx 2023 | LFO extraction for mod FX — underpins dual-LFO teaching |
| #75 | PresetShare hyper screech | Comb + heavy FM + macro detune culture |
| #76 | Mind Flux Serum 2 WT→LFO | Self-referential modulation curves |

---

## Preset index (35 total in lab)

**Archetype pack (§1–§6):** see `RIDDIM_ARCHETYPE_SECTIONS` in `lib/patch/presets/riddim-archetypes.ts`.

**Pro / legacy pack:** `pro-dual-lfo-growl`, `pro-stutter-wobble`, `pro-macro-wobble`, `pro-metallic-comb`, plus original 22 presets in `presets/index.ts`.

---

## Homework (A/B in browser)

1. Load `dsf-allpass-comb` vs `metallic-phaser` — compare comb vs phaser centroid on scope overlay.
2. `harsh-square-fm` with mod depth **+0.8** vs **−0.8** on cutoff CV.
3. `full-stack-gnarl` — confirm sub band unchanged when modulating FM index only.
4. Resample `infekt-constant-motion` → sampler → layer under `clean-sub` manually.
