# RIDDIM synthesis — research & patch direction

> Grounds the Patch Lab node catalog and example presets. Every technique below maps to a
> `technique:*` tag in presets and (eventually) the knowledge graph.  
> Sources: `docs/research/sources.md`.

---

## 1. What RIDDIM asks of a synth

RIDDIM is a dubstep subgenre built on **repetitive, halftime grooves** and **aggressive,
mid-focused bass movement** — not a single preset, but a small set of **signal-flow
architectures** that recur in producer tutorials.

Common traits (sourced from Serum-focused riddim guides):

| Trait | Typical implementation | Freq zone |
|-------|------------------------|-----------|
| **Sub weight** | Mono sine (or dedicated sub osc), minimal modulation | ~40–100 Hz |
| **Body / wobble** | Detuned saw or wavetable → **LPF** ← **LFO** | ~80–400 Hz |
| **Transient bite** | Fast **pitch envelope** at note-on | Broad (pitch drop) |
| **Timbre motion** | LFO or envelope → **wavetable position** | Harmonic series |
| **Metallic growl** | **FM** between oscillators | Mid harmonics |
| **Vowel / yoi** | Formant-style or resonant **filter sweeps** | 200 Hz–2 kHz |

Post-synth **distortion, OTT, and multiband compression** are ubiquitous in finished tracks
but are **Phase Two** for this lab — we teach synthesis first, processing later.

---

## 2. Four archetypes → patch graphs

### A. Clean sub (`technique:sub-layer`)

```
[Sine osc] ──audio──► [Output]
```

- Fundamental only; mono; no LFO on pitch.
- Teaches: pure low-end before adding harmonics.
- **Preset:** `clean-sub`

### B. Saw body (`technique:saw-body`)

```
[Saw osc] ──audio──► [Output]
```

- Harmonically rich source; optional detune/unison later.
- FFT shows full harmonic comb; foundation for subtractive filtering.
- **Preset:** `saw-body`

### C. Pitch bite (`technique:pitch-envelope`)

```
[Osc] ◄──cv-freq── [Env CV]
  │
  └──audio──► [Output]
```

- Fast pitch decay at note-on (see experiment 03 theory).
- RIDDIM pairing: sharp pitch drop + slower amplitude release.
- **Preset:** `pitch-bite` (requires envelope CV out — follow-up node work)

### D. Filter wobble (`technique:wobble-lfo-cutoff`)

```
[LFO] ──cv──► [Filter cutoff]
                ▲
[Saw osc] ──audio──┘
                │
                └──audio──► [Output]
```

- Core riddim wobble: LFO sweeps lowpass cutoff (often 1/4 or 1/8 tempo sync in DAWs;
  free-running Hz rate is fine for learning).
- Resonance 30–50% adds nasal “vocal” character (tutorial range).
- **Preset:** `wobble-stub`

---

## 3. Layer stack (experiment 06 alignment)

Production riddim often uses **three layers** summed before a shared filter:

| Layer | Source | Role |
|-------|--------|------|
| Sub | Sine, −1 octave | Felt low-end, mono |
| Body | Detuned saw / WT | Movement + mids |
| Top | Noise or bright WT | Bite (optional, later) |

```
[Sub osc] ──┐
[Body osc] ─┼──► [Mixer] ──► [Filter] ──► [Output]
[Top/noise]─┘
```

Keep sub **unmodulated**; apply LFO/WT motion on body only (Preset Drive, wobble guide).

---

## 4. Modulation matrix (build order)

Minimum modular set for riddim-shaped patches in Patch Lab:

| Node | RIDDIM role | CV / audio ports |
|------|-------------|------------------|
| **Oscillator** | Sub, saw body, FM carrier | `audio-out`, `cv-freq` in |
| **LFO** | Wobble, WT scan | `cv-out` |
| **Envelope** | Pitch bite, filter sweep | `cv-out`, `trigger` in |
| **Filter** | Subtractive + wobble target | `audio-in/out`, `cv-cutoff` |
| **Wavetable** | Timbral evolution | `audio-out`, `cv-pos` |
| **Mixer** | Sub/body sum | `audio-in[]`, `audio-out` |
| **Output** | Master bus | `audio-in` |

**Wave 1 (shipped):** LFO + Filter — unblocks `wobble-stub`.  
**Wave 2 (shipped):** Envelope CV out + pitch routing → `pitch-bite`, `env-filter-sweep`.  
**Wave A (shipped):** FM pair, distortion/waveshaper, tempo-synced LFO, 3-layer `layerStack`, sub CV protection.  
**Wave B (next):** Drawable LFO curves, formant bank, noise osc, mod matrix UI.

---

## 5. Example presets (Patch Lab)

| ID | Archetype | Nodes | Playable |
|----|-----------|-------|----------|
| `clean-sub` | A | osc, out, analyser | Yes |
| `saw-body` | B | osc, out, analyser | Yes |
| `wobble-stub` | D | osc, lfo, filter, out, analyser | Yes |
| `detuned-body` | B+ | osc, detune, out, analyser | Yes |
| `pitch-bite` | C | osc, env, filter, out, analyser | Yes |
| `sub-body-stack` | E | osc×2, detune, mixer, out, analyser | Yes |
| `unison-wobble` | D+ | osc, detune, lfo, filter, out, analyser | Yes |
| `wavetable-morph` | F | wavetable, out, analyser | Yes |
| `env-filter-sweep` | G | osc, env, filter, out, analyser | Yes |

Load via **Presets** panel in playground (`loadPreset`).

---

## 6. Knowledge graph extensions

Shipped in `graph/research/riddim-supplement.json` (merged by `npm run graph:extract`):

| Node ID | Maps to Patch Lab |
|---------|-------------------|
| `technique:sub-layer` | `clean-sub`, layer stack sub path |
| `technique:saw-body` | `saw-body`, `detuned-body` |
| `technique:pitch-envelope` | `pitch-bite` |
| `technique:wobble-lfo-cutoff` | `wobble-stub`, tempo-sync LFO |
| `technique:fm-growl` | `fm` node + `fmGrowl` preset |
| `technique:sub-body-split` | `layerStack` HP/LP splits |
| `technique:layer-stack-three` | 3-layer preset archetype |
| `technique:formant-yoi` | `formant` node |
| `technique:comb-metallic` | `modFx` comb/phaser |
| `technique:multiband-distortion` | `distortion` + multiband crossover |
| `technique:ott-glue` | `multiband` node |
| `technique:resample-workflow` | P3 #16 (not built) |
| `technique:envelope-matched-sub` | env + sub level routing |
| `technique:halftime-groove` | transport BPM context |

Edges: `experiment:*` **teaches** `technique:*`; `technique:*` **grounded-in** `source:research-*`.

---

## 7. Listening / reference homework

Use these as A/B references when tuning presets (not prescriptive of single sound):

- Subtronics — aggressive mid bass + separate sub (EDMProd breakdown)
- Virtual Riot — complex WT + FM movement (Preset Drive VR guide)
- Classic riddim wobble — triplet/eighth LFO on filter (Preset Drive wobble guide)

---

## 8. Open questions (flag, don’t invent)

1. **Tempo sync** — LFO rates in BPM divisions need transport clock; defer until Run carries BPM.
2. **Formant filter** — vowel/yoi character may need dedicated bandpass stack vs single biquad.
3. **FM node** — separate module vs osc pair with FM index param.
4. **Distortion** — essential in finished riddim; out of scope for Wave 1.
