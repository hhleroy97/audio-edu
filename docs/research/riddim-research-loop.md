# RIDDIM research loop — accumulating findings

> **Research mode:** intensive sprint sessions (e.g. ~5 min continuous), not a recurring timer.
> Each cycle appends a dated entry below, adds only **new** sources to `sources.md`, and
> avoids duplicating claims already in `riddim-synthesis.md` / `riddim-feature-roadmap.md`.
>
> **Tools:** web search, arXiv, producer tutorials, forums (Reddit often blocked from automation —
> use Dubstepforum, UKF, EDMProd, Preset Drive, Sound On Sound as proxies).
>
> **GitHits:** requires `githits login` locally — use for OSS reference implementations once authed.

---

## Research questions (standing)

1. What signal-flow architectures define riddim bass (sub / body / top)?
2. Which modulation routes appear in ~98% of Serum bass presets (academic benchmark)?
3. What browser/node-graph libraries should Patch Lab borrow from?
4. What post-synth processing is genre-standard vs teach-first?
5. How do community workflows (sample chop + resample vs pure synth) differ?

---

## Cycle 1 — 2026-06-16 (initial)

### A. Genre definition & aesthetic (not academic — producer culture)

| Claim | Source |
|-------|--------|
| Riddim = dubstep subgenre: **repetitive halftime groove**, ~**140–145 BPM**, minimal drums, bass-forward | [EDMProd riddim guide](https://www.edmprod.com/how-to-make-riddim/) |
| Energy comes from **flow and repetition**, not constant tearout aggression; dark, roomy textures | [Infekt UKF interview](https://ukf.com/read/infekts-guide-to-riddim/) |
| Blueprint artists: Subfiltronik (2012–2013 aesthetic), Subtronics, BadKlaat, Infekt, Virtual Riot | EDMProd; Preset Drive riddim guide |
| Drums: kick **1 & 3**, snare/clap **2 & 4**, plus **quieter kick on 2 & 4** (“whack”) | EDMProd |
| Infekt: bass needs **constant movement** — pitch bend, phaser, filter motion; static patches fail | [INFEKT Vital masterclass (YouTube)](https://www.youtube.com/watch?v=D-n9zU730Sc) |

**Patch Lab implication:** transport BPM + halftime grid (P3 feature 20) contextualizes LFO sync; guided lessons should stress *movement on body layer only*.

---

### B. Three-layer bass stack (sound design + layering)

Industry-standard frequency split (multiple independent tutorials converge):

| Layer | Range | Source | Rules |
|-------|-------|--------|-------|
| **Sub** | ~20–100 Hz (mono sine) | [Preset Drive layering](https://www.presetdrive.com/how-to-layer-basses-in-serum-for-massive-sound/); [Preset Drive wobbles](https://www.presetdrive.com/how-to-make-riddim-wobbles-in-serum/) | No LFO/wobble on sub; separate synth instance; LP sub ~150 Hz |
| **Body / mid** | ~100 Hz–3 kHz (growl, wobble, FM) | Preset Drive layering; [Preset Drive professional presets](https://www.presetdrive.com/how-to-make-serum-presets-sound-professional/) | HP body at 80–100 Hz; distortion + OTT here |
| **Top / fizz** | >2–3 kHz | Preset Drive wobbles § “Adding a Top Layer” | Noisy/bright WT, HPF >2 kHz, same LFO rate as body for sync |

**Community corroboration (Dubstepforum — Reddit proxy):**

- “I ALWAYS have a separate sub bass” — mid sits ~50–70 Hz higher than sub fundamental [Dubstepforum t=197237](https://www.dubstepforum.com/forum/viewtopic.php?t=197237)
- HP midrange ~150–200 Hz, layer sine underneath; sub “barely audible solo” but vital in mix
- Optional: freq-split mid patch ~150 Hz to compress/mono/EQ sub group separately while keeping movement matched to mid
- Drop cohesion: **match volumes**, **bus compression** on bass group, similar distortion amounts, shared reverb [Dubstepforum t=277299](https://www.dubstepforum.com/forum/viewtopic.php?t=277299)

**Subtronics-style workflow (sample-heavy):**

- Main bass from **chopped/resampled loop**, not always fresh Serum design [EDMProd](https://www.edmprod.com/how-to-make-riddim/)
- Sub plays **root fundamental only**; envelope must **match main bass** (LFO → sub level @ 1/4 note + ADSR tweak)
- Variation via **preset swaps** and chops, not one static patch for whole drop
- Post: Roar/distortion → OTT → envelope filter movement

**Patch Lab implication:** `layerStack` + sub CV protection (P0) aligns with forum consensus; **resample/bounce node (P3 #16)** is critical for EDMProd workflow parity.

---

### C. Archetype techniques (within body layer)

| Technique | Implementation | Sources |
|-----------|----------------|---------|
| **Wobble** | LFO → filter cutoff; 1/4 or 1/8 tempo sync; triplet/dotted for off-kilter groove; body 80–400 Hz | Preset Drive wobbles |
| **WT morph** | LFO → wavetable position; slow tempo sync | Preset Drive riddim bass |
| **FM growl** | FM from B; modulator active but level down; LFO → FM amount; modulator +4 oct common | [BassGorilla robotic bass](https://bassgorilla.com/serum-bass-tutorial-robotic-digital-dubstep-bass/); [Beatportal Serum FM](https://www.beatportal.com/articles/613509-this-months-five-production-techniques-for-serum); [Sound On Sound dubstep secrets](https://www.soundonsound.com/techniques/dubstep-secrets) |
| **Pitch bite** | Fast pitch env at note-on; mono glide 20–40 ms | Preset Drive riddim bass |
| **Yoi / vowel** | Formant or French/German LP filters; LFO/env → cutoff | Preset Drive riddim bass |
| **Distortion stack** | Tube/warm → hard clip/diode; **multiband**: no drive on sub band, heavy on mids | Preset Drive riddim + [multiband distortion guide](https://www.presetdrive.com/how-to-use-multiband-distortion-in-bass-music-production/) |
| **OTT** | Multiband upward compression; “mandatory” in finished riddim | Preset Drive riddim; EDMProd |

**Multiband distortion crossover starting point:** Band1 20–150 Hz (clean), Band2 150 Hz–4 kHz (heavy), Band3 4 kHz+ (air) — Preset Drive multiband guide.

---

### D. Academic & state-of-art DSP (arxiv + reviews)

| Paper | ID | Relevance to Patch Lab |
|-------|-----|------------------------|
| **Modulation Discovery with DDSP** | [arXiv:2510.06204](https://arxiv.org/abs/2510.06204) | Validates LFO/env as primary language; spline LFO curves; evaluated on Serum “Bass (Hard)” — **benchmark for mod matrix + custom LFO** |
| **Differentiable Wavetable Synthesis** | [arXiv:2111.10003](https://arxiv.org/abs/2111.10003) | 10–20 wavetables match additive DDSP; 12× faster inference — supports WT node + crossfade teaching |
| **DDSP review (Frontiers 2023)** | [10.3389/frsip.2023.1284100](https://www.frontiersin.org/journals/signal-processing/articles/10.3389/frsip.2023.1284100/full) | Surveys waveshaping, FM, WT in differentiable synth — roadmap for future ML-assisted preset analysis |
| **Neural Waveshaping** | arXiv:2107.05050 (existing) | Distortion on rich harmonics, not sine-only |
| **Continuous descriptor control** | arXiv:2302.13542 (existing) | Brightness/centroid overlays (P3 #18) |
| **Bass accompaniment (latent diffusion)** | [arXiv:2402.01412](https://arxiv.org/abs/2402.01412) | Style-conditioned bass stem gen — out of scope for Patch Lab v1 but useful for homework/reference |
| **BassNet (VAE)** | [MDPI Appl. Sci. 2020](https://www.mdpi.com/2076-3417/10/18/6627) | Interactive 2D latent for bass patterns — future “AI assist” axis |
| **CVAE RAVE bass fix** | [arXiv:2211.08715](https://arxiv.org/abs/2211.08715) | “Missing bass” in neural synth — reinforces **dedicated mono sub layer** teaching |

**Key academic takeaway:** No riddim-specific dataset exists; **Serum bass preset modulation structure** (A1) is the closest peer-reviewed proxy for what Patch Lab should teach.

---

### E. OSS libraries & techniques for this repo

Already cited in `UI_OVERHAUL_HANDOFF.md`; expanded with 2024–2026 landscape:

| Project | URL | Take for audio-edu |
|---------|-----|-------------------|
| **React Flow + Web Audio tutorial** | reactflow.dev/learn/tutorials/react-flow-and-the-web-audio-api | Canonical patch pattern |
| **synflow** | https://github.com/k1ln/synflow | Hybrid audio + control EventBus; AudioWorklet processors; React 19 + @xyflow/react |
| **audio-nodes** | https://github.com/jonothanhunt/audio-nodes | Rust/WASM in AudioWorklet; param modulation graph; live modulated param preview |
| **Modulr** | https://github.com/shoegazerstella/Modulr | Macro instruments (subgraphs); n8n-style UX |
| **plinth** | https://github.com/rsimmons/plinth | Typed ports, serializable patches |
| **aumlet** | https://github.com/katspaugh/aumlet | Single-worklet whole graph; patch matrix |
| **flow-synth** | https://github.com/katspaugh/flow-synth | Minimal Flow editor reference |
| **SynthEngineer blog** | synthengineer.com/blog/web-audio-modular-js | Connection registry + cycle detection + `currentTime` clock |
| **audioMotion-analyzer** | npm `audiomotion-analyzer` | Spectrum for descriptor overlays |
| **react-joyride** | react-joyride.com | Guided walkthrough on canvas |

**Technique priorities from OSS review:**

1. **Param-modulation edges** like audio-nodes (CV depth, live preview when modulated)
2. **Macro/subgraph nodes** like Modulr for “sub layer preset” teaching units
3. **Cycle validation before connect** (SynthEngineer / plinth)
4. **Optional WASM DSP** only if Web Audio biquads/LFO limits bite — not blocking Wave C

---

### F. Reddit / community (access notes)

| Source | Status | Mitigation |
|--------|--------|------------|
| r/synthrecipes | Blocked from automated fetch (2026-06-16) | Manual browse; Dubstepforum + Preset Drive cover same topics |
| r/soundsynthesis | Blocked | Use Dubstepforum, DSF archives, Beatportal |
| Dubstepforum | ✅ Accessible | Sub layering threads cited above |

**Next cycle targets:** search `site:reddit.com` via web index summaries; Vital-specific riddim threads; r/edmproduction halftime bass.

---

### G. Gaps (remaining)

- [x] Vital riddim techniques — cycle 2
- [x] arXiv FM-DDSP (Caspe DDX7) — cycle 2
- [ ] Reddit direct thread URLs (site blocks bots; use manual paste)
- [ ] GitHits code reads: synflow, audio-nodes (needs `githits login`) — **authed 2026-06-16**; use in phase 72/73
- [x] Pro modulation implementation plan — `.planning/ROADMAP.md` phases 71–75
- [x] Reference track homework list — cycle 2
- [x] Serum 2 vs Vital mod matrix — cycle 2

---

## Cycle 2 — 2026-06-16 (continuous sprint)

### H. Vital-specific riddim workflow

| Technique | Detail | Source |
|-----------|--------|--------|
| **3 osc + 3 filters** | Extra osc/filter vs Serum 1 — future riddim uses warp modes heavily | [Vital forum — future riddim](https://forum.vital.audio/t/tutorial-making-a-future-riddim-bass-in-vital/7296) |
| **LFO → cutoff** | 1/8 or 1/16 tempo sync; triangle = smooth, square = stutter | [Ultrasamples Vital tutorial](https://www.ultrasamples.com/post/how-to-use-vital-synth-short-vital-tutorial) |
| **Sub osc** | Dedicated sine sub routed with body through LP ~100 Hz | Ultrasamples |
| **Unison on body only** | 2–4 voices on osc1; phase randomization 0 for punch | Ultrasamples |
| **Spectral warp** | Frequency-domain morph — richer WT transitions than linear crossfade | PluginDrop Serum vs Vital |
| **Audio-rate FM** | Oscillator-as-modulator natively — aggressive bass without separate FM module | PluginDrop; Pluginoise review |
| **Visual mod matrix** | Color-coded curves on knobs — good teaching UI reference for Patch Lab | Pluginoise |

**Infekt (Vital):** pitch bend as primary movement tool; sounds must never stay static — aligns with mod-discovery paper’s emphasis on time-varying control.

---

### I. Serum 2 vs Vital — lesson scripting

| Dimension | Serum 2 | Vital | Patch Lab target |
|-----------|---------|-------|------------------|
| LFO count | 10 (+ chaos Lorenz/Rossler) | 8 (+ random) | Custom LFO curves + tempo sync (shipped) |
| Envelopes | 4 | 6 DAHDSR | Amp + bipolar CV (shipped) |
| Mod matrix | Reorder, bypass, aux curves, osc-as-mod-source | Real-time curve overlay on params | `PatchModMatrix` + depth (shipped) |
| Oscillators | 3 (WT, granular, spectral, sample) | 3 WT + spectral morph | WT + FM + noise (shipped) |
| FX routing | Dual FX busses, multiband split, mono-bass utility | Built-in distortion/filter stack | filterBank, multiband, modFx (shipped) |
| Preset ecosystem | Industry default for riddim tutorials | Free; Infekt uses Vital | Teach concepts synth-agnostic |

Sources: [Xfer Serum 2 What's New PDF](https://static.xferrecords.com/Serum%202%20What%27s%20New.pdf); [DAW Zone 2026 comparison](https://dawzone.com/serum-2-vs-pigments-6-vs-vital-which-soft-synth-is-the-best); [PluginDrop comparison](https://plugindrop.net/posts/serum-vs-vital-comparison/).

---

### J. Layering pitfalls (phase & dynamics)

From [EDM Templates layering guide](https://edmtemplates.net/blogs/edm-templates-blog/sound-layering-techniques) — explicitly calls out **riddim/tearout**:

| Pitfall | Fix |
|---------|-----|
| Stacking 3 random patches → **phase cancellation** | EQ boundaries; zoom waveform transients; align peaks |
| Sub not mono | Anchor layer 20–100 Hz sine/triangle, no width |
| Competing transients | One layer owns punch; soften attack on sub/top |
| Weak glue | OTT at 30–40% (not 100%); slow-attack bus comp (10–30 ms) |
| MIDI layering drift | **Bounce to audio** before phase-align (supports resample node) |

Cross-genre sub discipline: [Preset Drive DnB sub guide](https://www.presetdrive.com/dnb-sub-bass-serum/) — mono sine, unison=1, fast amp attack, HP mid 80–120 Hz, LP sub 80–120 Hz crossover.

---

### K. Artist reference homework (A/B presets)

Tracks/tutorials to use when tuning Patch Lab presets (listening only — not spectral claims):

| Artist | Why | Reference |
|--------|-----|-----------|
| **Subfiltronik** | Blueprint riddim (2012–2013); Infekt’s stated target | UKF Infekt interview |
| **Subtronics** | Sample-chop + envelope-matched sub workflow | EDMProd SHUTUP-style structure |
| **Infekt** | Pitch-bend movement; Vital minimal aggression | YouTube masterclass |
| **Virtual Riot** | Complex WT + FM (Preset Drive VR guide — existing source #3) | riddim-synthesis.md |
| **RAK — SHUTUP** | EDMProd arrangement reference @ 140 BPM | EDMProd |
| **Modern trench/riddim** | Square-wave warp trick; comb filter + unison hyper layer | [YouTube — modern riddim/trench](https://www.youtube.com/watch?v=SqVVQ77u-Fg) |

**Homework protocol:** load `wobble-stub` / `fm-growl` / `layerStack` preset → A/B against reference at matched BPM → note centroid/brightness on scope (future descriptor overlays P3 #18).

---

### L. Academic — differentiable FM (DDX7)

**Caspe, McPherson, Sandler — DDX7** ([arXiv:2208.06169](https://arxiv.org/abs/2208.06169), ISMIR 2022):

- Differentiable DX7-style FM: **fixed ratios**, DNN drives **modulation index + volume envelopes** from pitch/loudness frames
- Validates teaching FM as **ratio + time-varying index** (matches Chowning + riddim growl practice)
- Code/demo: https://fcaspe.github.io/ddx7/

Complements arXiv:2510.06204 (LFO/env discovery) — together they justify Patch Lab’s FM node + envelope CV + custom LFO curves as the pedagogical core.

---

### M. Related bass archetypes (adjacent genres)

Reese/unison + filter-LFO patterns from [Transmission Samples Reese guide](https://www.transmissionsamples.com/tutorials/sound-design/reese-bass-create):

- Detuned saw unison = body layer precursor
- **Key-tracked LFO** → filter cutoff (speed follows pitch) — candidate future node feature
- Modern reese uses WT + FM + resampling — same workflow as Subtronics riddim

---

## Cycle 3 — 2026-06-16 (continuous sprint)

### N. Production workflow (beyond synthesis)

| Stage | Practice | Source |
|-------|----------|--------|
| **Template** | 140 BPM; groups: Sub Bass, Mid Bass×2, Drums, FX | Preset Drive Ableton template (#55) |
| **Design** | Session View — multiple bass clips to audition | #55 |
| **Resample** | Record bass bus → chop/warp → Simpler or arrangement | #55; EDMProd (#5) |
| **Arrange** | Drop-first; intro/build by subtracting elements | EDMProd; Soundtrap halfstep (#56) |
| **Halfstep pocket** | Sparse kick/snare; sub sidechain to kick (gentle) | Soundtrap #56 |
| **Phrase length** | 16–32 bar loops; second-drop hat/bass timbre swaps | Soundtrap; Melodigging (#57) |

**Genre framing (Melodigging):** riddim = loop-driven, call-and-response bass shots, formant/comb growls, sub reinforcement — energy from repetition not density.

---

### O. FM + comb/phaser stack (harsh riddim recipe)

From [Preset Drive FM guide](https://www.presetdrive.com/serum-fm-synthesis/) — explicit **harsh riddim** patch:

1. OSC A sine −1 oct; FM from B ~55%
2. OSC B harsh WT (+5 st)
3. LFO1 → FM index (custom sharp rises, 1/4)
4. LFO2 → LP cutoff (1/8); resonance ~50%
5. Comb/phaser on mids for metallic peaks ([RPS phaser guide](https://rocketpoweredsound.com/blogs/production/5-secret-ways-to-make-basses-in-serum))
6. Hard clip → OTT 30–40%

Neurofunk parallel ([Preset Drive neuro](https://www.presetdrive.com/neurofunk-bass-design-serum/)): dual-LFO **different rates** on cutoff vs WT vs FM = non-repeating motion — candidate advanced lesson after single wobble.

---

### P. Mix — spectral ducking (P3 #19 grounding)

Kick/bass overlap: broadband sidechain pumps; **spectral ducking** ducks only clashing bins (50–100 Hz kick fundamental).

- Producer tools: sonible smart:comp (#61)
- Academic prior: McCormack FFT DRC (#15) — Patch Lab `multiband`/future duck node
- Stem separation context: BS-RoFormer band-split ([arXiv:2309.02612](https://arxiv.org/abs/2309.02612)) — not in-scope for synthesis teaching but explains why multiband thinking persists

---

### Q. Knowledge graph update (cycle 3)

Merged **20 research nodes + 18 edges** via `graph/research/riddim-supplement.json`:

- 3 concepts: `riddim`, `resampling`, `phase-cancellation`
- 14 techniques (sub-layer through halftime-groove)
- 3 academic source nodes (mod discovery, DDX7, diff WT)
- Edges link experiments 03/04/05/06 → techniques

Run: `npm run graph:extract -- --force`

---

## Cycle 4 — 2026-06-16 (gnarly archetype sprint)

### A. Community & forum pass (Reddit proxies)

| Finding | Source |
|---------|--------|
| Riddim = repetitive FM/plain wobble @ **1/4**; brostep has more variation | DSF #64 |
| Square + FM from B; LFO on volume, cutoff, FM; **second LFO half-rate on FX** | DSF #64 |
| Cymatics FM WT → volume LFO → **allpass ~2–5% @ ~20 Hz** → comb/flanger | DSF #64 |
| Virtual Riot riddim: macro comb tuning, FM, detune, comb feedback throws | PresetShare #72 |
| Hyper tearout screech: detune + high FM + comb sustain | PresetShare #75 |
| Audiotool: WT/FM + env automation + **distortion stack** + separate sine sub | #77 |

### B. arXiv additions

| Paper | Patch Lab mapping |
|-------|-------------------|
| NAS-FM (#67) | Validates FM ratio/index as primary growl knobs |
| CONMOD (#71) | Comb/flanger LFO rate + feedback → `modFx` node params |
| Mitcheltree DAFx (#74) | Dual-LFO teaching + mod matrix depth |

### C. GitHits — Web Audio API

Indexed `webaudio/web-audio-api`: `WaveShaperNode.curve` bipolar shaping; `BiquadFilterNode` cutoff/Q as `AudioParam` — confirms Patch Lab CV additive model (#9).

### D. Deliverables

- **`docs/research/riddim-sound-catalog.md`** — 6 subsections, 13 archetype presets
- **`lib/patch/presets/riddim-archetypes.ts`** — grouped `RIDDIM_ARCHETYPE_SECTIONS`
- **`PatchPresetPanel`** — subsection headers in preset UI
- Sources **#63–78**; graph supplement extended

---

| Cycle | Date | New sources added | Notes |
|-------|------|-------------------|-------|
| 1 | 2026-06-16 | 19–43 in sources.md | Initial compile; Reddit blocked; GitHits auth missing |
| 2 | 2026-06-16 | 44–54 in sources.md | Vital + DDX7 + phase layering + Serum2/Vital |
| 3 | 2026-06-16 | 55–62 in sources.md | Workflow/resample; FM+comb; graph supplement merged |
| 4 | 2026-06-16 | 63–78 in sources.md | Gnarly archetype catalog; 13 presets; DSF/arXiv/forum pass |
