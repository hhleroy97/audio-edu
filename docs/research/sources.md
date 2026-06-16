# Sources — RIDDIM synthesis research

> Provenance for `riddim-synthesis.md`. Do not cite claims without an entry here.

## Sound-design tutorials

1. **Preset Drive — How to Make Riddim Bass in Serum** — wavetable position LFO, formant filters, sub/body split, mono sub below 200 Hz  
   https://www.presetdrive.com/how-to-make-riddim-bass-in-serum-complete-sound-design-guide/

2. **Preset Drive — How to Make Riddim Wobbles in Serum** — LFO → filter cutoff, 80–400 Hz body range, sub layer underneath, tempo-synced LFO rates  
   https://www.presetdrive.com/how-to-make-riddim-wobbles-in-serum/

3. **Preset Drive — Virtual Riot Style Bass in Serum** — FM depth, dual-oscillator blend, WT position automation, dual LFO + manual cutoff  
   https://www.presetdrive.com/virtual-riot-bass-design-serum/

4. **BassGorilla — Serum robotic digital dubstep bass** — FM between oscillators, filter resonance + LFO trigger modes  
   https://bassgorilla.com/serum-bass-tutorial-robotic-digital-dubstep-bass/

5. **EDMProd — How to Make Riddim like Subtronics** — sample-based bass + separate sub layer, envelope-matched sub, distortion/OTT as post stage  
   https://www.edmprod.com/how-to-make-riddim/

## Synthesis fundamentals (project docs)

6. **Experiment 03 — Pitch envelopes** — pitch ADSR vs amplitude ADSR, RIDDIM transient pairing  
   `app/experiments/03-pitch-envelopes/docs/theory.md`

7. **Experiment 06 — Layering** — sub / body / top roles, shared filter on sum  
   `app/experiments/06-layering/docs/theory.md`

8. **Experiment 04 — Wavetable** — table position morph, envelope-driven timbre  
   `app/experiments/04-wavetable/docs/theory.md`

## Web Audio implementation

9. **MDN — AudioParam** — connecting audio-rate signals to parameters (additive modulation)  
   https://developer.mozilla.org/en-US/docs/Web/API/AudioParam

10. **MDN — BiquadFilterNode** — lowpass cutoff and Q for subtractive wobbles  
    https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode

---

## Academic & DSP

11. **Mitcheltree, Tan, Reiss — Modulation Discovery with DDSP** (arXiv:2510.06204, WASPAA 2025) — LFO/envelope extraction; ~98% Serum presets use modulation; spline LFO parameterization; Serum “Bass (Hard)” evaluation set  
    https://arxiv.org/abs/2510.06204

12. **Chowning — The Synthesis of Complex Audio Spectra by Means of Frequency Modulation** (JAES, 1973) — FM ratios, modulation index, time-varying index for brass/pluck/bassoon-like timbres  
    https://ccrma.stanford.edu/courses/220b-winter-2007/topics/papers/fm.html

13. **Hayes et al. — Neural Waveshaping Synthesis** (arXiv:2107.05050) — Harmonic exciter + learned waveshaping; distortion as spectral enrichment  
    https://arxiv.org/abs/2107.05050

14. **Klatt — Software for a Cascade/Parallel Formant Synthesizer** (JASA, 1980) — Vowel resonances via formant filters  
    https://www.fon.hum.uva.nl/david/ma_ssp/doc/Klatt-1980-JAS000971.pdf

15. **McCormack et al. — FFT-Based Dynamic Range Compression** (DAFx 2017) — Frequency-dependent compression; kick–bass ducking  
    https://leomccormack.github.io/sparta-site/docs/help/related-publications/mccormack2017fft.pdf

16. **Turian et al. — Continuous descriptor-based control for deep audio synthesis** (arXiv:2302.13542) — Brightness/loudness as synthesis controls  
    https://arxiv.org/abs/2302.13542

17. **Flores-García et al. — Sketch2Sound** (ICASSP 2025) — Time-varying loudness, spectral centroid, pitch as generative controls  
    https://interactiveaudiolab.github.io/assets/papers/floresgarcia2025icassp.pdf

18. **CCRMA — Formant Filtering Example** — 2–3 biquad formants for vowel synthesis  
    https://ccrma.stanford.edu/~jos/fp3/Formant_Filtering_Example.html

---

## Research loop — cycle 1 additions (2026-06-16)

### Producer tutorials & layering

19. **Preset Drive — How to Layer Basses in Serum** — three-layer sub/mid/top frequency zones; separate Serum instances; EQ boundaries  
    https://www.presetdrive.com/how-to-layer-basses-in-serum-for-massive-sound/

20. **Preset Drive — Professional Serum Presets** — 20–100 Hz sub, 100–2 kHz mid character, 2 kHz+ top; HP mid at 80–100 Hz  
    https://www.presetdrive.com/how-to-make-serum-presets-sound-professional/

21. **Preset Drive — Multiband Distortion in Bass Music** — 20–150 Hz clean sub band; heavy mids; riddim hard-clip character  
    https://www.presetdrive.com/how-to-use-multiband-distortion-in-bass-music-production/

22. **Preset Drive — Serum Wavetables Guide** — WT choice for wobble vs sub; unison on mid not sub  
    https://www.presetdrive.com/serum-wavetables-guide/

23. **ADSR — Skrillex Growl in Serum** — FM + WT LFO + bandpass formant + OTT stack  
    https://www.adsrsounds.com/serum-tutorials/making-a-skrillex-growl-in-serum/

24. **Beatportal — Five Serum Production Techniques** — filter LFO wobble, FM from B, stacked FM + noise  
    https://www.beatportal.com/articles/613509-this-months-five-production-techniques-for-serum

25. **Sound On Sound — Dubstep Secrets** — ES2 FM + tempo-sync LFO filter; classic wobble architecture  
    https://www.soundonsound.com/techniques/dubstep-secrets

26. **SoundCy — Dubstep Wobble FM Techniques** — carrier/modulator FM wobble; LFO → index; distortion post-FM  
    https://soundcy.com/article/how-to-make-dubstep-sounds

### Genre context & artist workflow

27. **UKF — Infekt’s Guide to Riddim** — flow vs tearout energy; Subfiltronik 2012–2013 blueprint; ~140 BPM  
    https://ukf.com/read/infekts-guide-to-riddim/

28. **INFEKT — Riddim Sound Design & Vital (YouTube)** — pitch bend movement; Vital workflow; non-static bass  
    https://www.youtube.com/watch?v=D-n9zU730Sc

29. **Soundteams — INFEKT Vital masterclass listing** — minimal aggressive bass; custom effect racks  
    https://www.soundteams.com/masterclass/riddim-sound-design-tips-introduction-to-vital

### Community forums (Reddit proxies)

30. **Dubstepforum — Isolating sub vs layering sub** — always separate sine sub; HP mid ~150–200 Hz  
    https://www.dubstepforum.com/forum/viewtopic.php?t=197237

31. **Dubstepforum — Making drop basses flow together** — volume match, bus compression, shared reverb  
    https://www.dubstepforum.com/forum/viewtopic.php?t=277299

32. **Beat Kitchen — Bass Design and the Low End** — sub tuning; kick–bass sidechain; frequency separation  
    https://beatkitchen.io/guides/electronic-music/04-bass-design/

### Academic (additional)

33. **Shan et al. — Differentiable Wavetable Synthesis** (arXiv:2111.10003, ICASSP 2022) — 10–20 WT dictionary; 12× faster than additive DDSP  
    https://arxiv.org/abs/2111.10003

34. **Frontiers review — Differentiable DSP for music/speech** (2023) — surveys WT, FM, waveshaping in DDSP  
    https://www.frontiersin.org/journals/signal-processing/articles/10.3389/frsip.2023.1284100/full

35. **Hansen et al. — Bass Accompaniment via Latent Diffusion** (arXiv:2402.01412) — style-conditioned bass stems; timbre grounding  
    https://arxiv.org/abs/2402.01412

36. **BassNet — VAE bass generation with 2D control** (MDPI Appl. Sci. 2020) — interactive latent for bass patterns  
    https://www.mdpi.com/2076-3417/10/18/6627

37. **CVAE RAVE polyphonic improvement** (arXiv:2211.08715) — pitch-conditioned low-frequency fix (“missing bass”)  
    https://arxiv.org/abs/2211.08715

38. **Mitcheltree — Modulation Discovery project page + code** — VST plugins; Serum Bass (Hard) eval  
    https://christhetr.ee/mod_discovery/  
    https://github.com/christhetree/mod_discovery

### OSS reference implementations

39. **synflow** — @xyflow/react + Web Audio + AudioWorklet hybrid graph  
    https://github.com/k1ln/synflow

40. **audio-nodes** — Rust/WASM AudioWorklet; React Flow param modulation  
    https://github.com/jonothanhunt/audio-nodes

41. **Modulr** — React Flow modular synth; macro instruments  
    https://github.com/shoegazerstella/Modulr

42. **aumlet** — single AudioWorklet modular graph  
    https://github.com/katspaugh/aumlet

43. **flow-synth** — minimal Flow-based modular synth  
    https://github.com/katspaugh/flow-synth

### Sprint cycle 2 (2026-06-16)

44. **Vital forum — Future Riddim Bass tutorial** — warp modes, extra osc/filters  
    https://forum.vital.audio/t/tutorial-making-a-future-riddim-bass-in-vital/7296

45. **Ultrasamples — Vital short tutorial** — LFO 1/8–1/16, sub osc, LP ~100 Hz  
    https://www.ultrasamples.com/post/how-to-use-vital-synth-short-vital-tutorial

46. **Caspe et al. — DDX7 Differentiable FM** (arXiv:2208.06169, ISMIR 2022) — FM index envelopes from audio  
    https://arxiv.org/abs/2208.06169  
    https://fcaspe.github.io/ddx7/

47. **EDM Templates — Sound layering / phase cancellation** — riddim/tearout mono sub rules; OTT 30–40%  
    https://edmtemplates.net/blogs/edm-templates-blog/sound-layering-techniques

48. **Preset Drive — DnB sub in Serum** — mono sine discipline; 80–120 Hz crossover with mid  
    https://www.presetdrive.com/dnb-sub-bass-serum/

49. **Transmission Samples — Reese bass design** — unison body, key-tracked LFO filter, resampling  
    https://www.transmissionsamples.com/tutorials/sound-design/reese-bass-create

50. **Xfer — Serum 2 What's New** — 10 LFOs, matrix reorder/bypass, dual FX bus, mono-bass utility  
    https://static.xferrecords.com/Serum%202%20What%27s%20New.pdf

51. **DAW Zone — Serum 2 vs Vital 2026** — mod depth comparison for bass workflows  
    https://dawzone.com/serum-2-vs-pigments-6-vs-vital-which-soft-synth-is-the-best

52. **PluginDrop — Serum vs Vital 2026** — spectral morph, audio-rate FM, bass design notes  
    https://plugindrop.net/posts/serum-vs-vital-comparison/

53. **Pluginoise — Serum vs Vital review** — matrix UX; real-time mod visualization  
    https://pluginoise.com/serum-vs-vital-synth-review/

54. **YouTube — Modern riddim/trench from scratch** — square warp, comb filter, hyper unison layer  
    https://www.youtube.com/watch?v=SqVVQ77u-Fg

### Sprint cycle 3 (2026-06-16)

55. **Preset Drive — Dubstep project template (Ableton)** — 140 BPM groups; resampling workflow  
    https://www.presetdrive.com/how-to-set-up-a-dubstep-project-template-in-ableton-live/

56. **Soundtrap — UK halfstep guide** — 140 BPM kick/snare pocket; resample mid-bass; 16–32 bar phrases  
    https://blog.soundtrap.com/uk-halfstep-edm-guide/

57. **Melodigging — Tearout/Riddim genre note** — loop-driven drops, formant/comb growls, double-drop DJ culture  
    https://www.melodigging.com/genre/tearout

58. **Preset Drive — Serum FM synthesis guide** — harsh riddim FM recipe; comb/phaser on FM harmonics  
    https://www.presetdrive.com/serum-fm-synthesis/

59. **Preset Drive — Neurofunk bass (adjacent)** — multi-filter routing, comb LFO, custom LFO shapes  
    https://www.presetdrive.com/neurofunk-bass-design-serum/

60. **Rocket Powered Sound — Serum bass secrets** — phaser for vocal/grit; misc comb filters  
    https://rocketpoweredsound.com/blogs/production/5-secret-ways-to-make-basses-in-serum

61. **sonible — Spectral sidechain ducking** — frequency-selective kick/bass pocket (McCormack-adjacent)  
    https://www.sonible.com/blog/spectral-ducking-smartcomp/

62. **Luo & Yu — BS-RoFormer** (arXiv:2309.02612) — band-split spectral modeling; stem separation context  
    https://arxiv.org/abs/2309.02612

### Sprint cycle 4 — gnarly archetypes (2026-06-16)

63. **Preset Drive — Riddim wobbles § body range** — 80–400 Hz hydraulic body; HP for sub split  
    https://www.presetdrive.com/how-to-make-riddim-wobbles-in-serum/

64. **DSF Community — Riddim production thread** — square+FM, 1/4 LFO, half-rate FX LFO, allpass→comb chain  
    https://community.dsf.ninja/t/riddim-a-type-of-dubstep-production-techniques-help-thread/12308

65. **Preset Drive — Wobble bass guide** — triplet/dotted LFO divisions; FM on osc for wobble complexity  
    https://www.presetdrive.com/how-to-create-wobble-bass-in-serum-for-dubstep/

66. **Preset Drive — Neurofunk / screech guide** — pitch-mod FM, HP screech 500–800 Hz, noise grit layer  
    https://www.presetdrive.com/how-to-make-neurofunk-in-serum/

67. **Huang et al. — NAS-FM** (arXiv:2305.12868, IJCAI 2023) — neural search for FM synth architecture  
    https://arxiv.org/abs/2305.12868

68. **UKF — Infekt riddim guide** — constant pitch/filter/phaser motion; static patches fail  
    https://ukf.com/read/infekts-guide-to-riddim/

69. **Preset Drive — Riddim bass guide § formant/yoi** — French/German LP vowel sweeps; dual filter series  
    https://www.presetdrive.com/how-to-make-riddim-bass-in-serum-complete-sound-design-guide/

70. **Preset Drive — Wobble § resonance** — 30–40% Q at 200–400 Hz for vocal wobble quality  
    https://www.presetdrive.com/how-to-create-wobble-bass-in-serum-for-dubstep/

71. **Carson et al. — CONMOD** (arXiv:2406.13935) — controllable neural phaser/flanger; comb as delay-line notches  
    https://arxiv.org/abs/2406.13935

72. **PresetShare — Complex Riddim Bass** — macro comb tuning + FM + max modulation density  
    https://presetshare.com/p11579

73. **Preset Drive — Tearout presets guide** — stacked distortion, audio-rate LFO, riddim-tearout hybrid  
    https://www.presetdrive.com/tearout-serum-presets/

74. **Mitcheltree et al. — Modulation Extraction for LFO-driven FX** (DAFx 2023) — phaser/flanger LFO recovery  
    https://www.aes.org/e-lib/browse.cfm?elib=22022

75. **PresetShare — Hyper Tearout Screech** — detune + high FM + comb filter sustain bass  
    https://presetshare.com/p11601

76. **Mind Flux — Serum 2 WT as LFO curve** — wavetable shape as modulation path (conceptual parity with custom LFO)  
    https://www.mind-flux.com/news-1/2025/11/10/using-wavetables-as-lfo-curves-in-serum-2-modulation-from-sound

77. **Audiotool forum — Dubstep bass basics** — FM/WT + multistage env + distortion stack + separate sub  
    https://www.audiotool.com/board/sound_design/basics_to_making_dubstep

78. **Polarity — Bitwig Phase-4 dubstep bass** — additive partials + FM + EQ split ~300 Hz  
    https://polarity.me/posts/polarity-music/2022-03-01-dubstep-bass-sounds-without-vital-or-serum-bitwig-phase-4/

### Procedural / algorithmic composition (phase 76 research)

79. **TidalCycles** — Haskell pattern language; cyclic mini-notation; SuperDirt backend  
    https://tidalcycles.org/ · https://github.com/tidalcycles/Tidal

80. **Strudel** — JavaScript Tidal port; browser Web Audio; `@strudel/web`  
    https://strudel.cc/ · https://github.com/tidalcycles/strudel · https://codeberg.org/uzu/strudel

81. **Alda** — score DSL; programmatic composition via external languages  
    https://github.com/alda-lang/alda · doc/writing-music-programmatically.md

82. **Sonic Pi** — Ruby live-coding; SC backend; built-in WAV record  
    https://sonic-pi.net/ · https://github.com/sonic-pi-net/sonic-pi

83. **SuperCollider** — real-time synthesis server (Tidal/Sonic Pi backend)  
    https://github.com/supercollider/supercollider

84. **FoxDot** — Python live-coding on SuperCollider  
    https://github.com/Qirky/FoxDot

85. **toplap/awesome-livecoding** — curated live-coding tools list  
    https://github.com/toplap/awesome-livecoding

86. **Strudel vs Tidal comparison (Soniare)** — browser vs Haskell; pattern algebra  
    https://www.soniare.net/blog/live-coding-systems-comparison

87. **IllMuzik — live coding export workflows** — Sonic Pi WAV; Tidal MIDI routing  
    https://www.illmuzik.com/threads/daws-are-nice-but-have-you-ever-tried-live-coding-music.45405/

88. **Barn Lab — Strudel programming music** — pattern-as-data; export limitations  
    https://warped3.substack.com/p/programming-music

## Research loop — multibus song engine (2026-06-16, phase 81)

89. **Web Audio API — ChannelMerger multibus scheduling** — GitHits solution `355afbb7`; per-bus GainNode, schedule at `currentTime`  
    https://app.githits.com/solutions/355afbb7-934f-4470-b533-aa4647586802

90. **Tone.js — Channel routing + Transport loops** — GitHits solution `d0296a62`; part channels, send buses, `triggerAttackRelease` at `time`  
    https://github.com/Tonejs/Tone.js · https://app.githits.com/solutions/d0296a62-0597-4dea-9f65-e272f88417a5

91. **Strudel pattern combinators (stack/cat/slow)** — GitHits distilled engine `600680ce`; port subset to Zod IR  
    https://github.com/tidalcycles/strudel · https://app.githits.com/solutions/600680ce-f64a-447b-8da1-fe897d5bcb15

92. **Parallel layer patch lab (Web Audio)** — GitHits solution `3c31252a`; named layers → master mixBus  
    https://app.githits.com/solutions/3c31252a-207c-41b6-a0ef-54541a81e49e

93. **Preset Drive — Layer Basses in Serum** — sub/mid/top zones; separate instances (maps to SongLayerDef)  
    https://www.presetdrive.com/how-to-layer-basses-in-serum-for-massive-sound/ · see also #19

94. **UKF — Infekt Riddim Guide** — flow, repetition, non-static bass (arrangement sections)  
    https://ukf.com/read/infekts-guide-to-riddim/ · see also #27

95. **Project architecture** — `.planning/phases/81-multibus-riddim-songs/`, `docs/research/multibus-song-engine-landscape.md`

## Research loop — riddim arrangement & mod layering (2026-06-16, cycle 5)

96. **Web Audio API — AudioParam automation** — `setValueAtTime`, `linearRampToValueAtTime`; song scheduler CV keyframes  
    https://webaudio.github.io/web-audio-api/#automation-methods · GitHub: `webaudio/web-audio-api`

97. **Tone.js Channel send/receive buses** — GitHits: per-part routing before master (`Tone/component/channel/Channel.ts`)  
    https://github.com/Tonejs/Tone.js · see also #90

98. **DSF — Virtual Riot wobble bass thread** — dual LFO (cutoff + FM), square+FM recipe  
    see #64 · https://forum.dsf.ninja/

99. **Infekt riddim arrangement flow** — repetition, non-static bass, section contrast  
    see #35, #94 · https://ukf.com/read/infekts-guide-to-riddim/

100. **Hydraulic press / 1/4 wobble pocket** — Subfiltronik minimal repetition  
     see #63 · `docs/research/riddim-sound-catalog.md` §1

101. **Modulation Discovery (arXiv)** — LFO→filter dominance in hard bass presets  
     see #11 · https://arxiv.org/abs/2305.12868

## Research loop — song mix phase 1 (2026-06-16)

103. **Layer mix strips + master chain** — `lib/song/multibus/mix-profiles.ts`, `layer-mix-strip.ts`, `master-chain.ts`; riddim sub/body/top frequency rules (#19, #47, #93)

## Research loop — mix agent phase 2 (2026-06-16)

104. **Tone.js Limiter + Compressor** — GitHits `Tone/component/dynamics/Limiter.ts`; fast attack limiter as master ceiling pattern  
    https://github.com/Tonejs/Tone.js

105. **MixDef schema + deterministic mix pass** — `lib/schemas/mix.ts`, `lib/song/mix/`; stem RMS/centroid → proposed gains/EQ  
    `docs/research/song-mix-agent-phase2.md`

106. **Web Audio analysis** — windowed DFT centroid for offline stem metrics (#96); AnalyserNode metering pattern

## Research loop — drums + sidechain phase 3 (2026-06-16)

107. **Web Audio `AudioBufferSourceNode.start(when)`** — sample-accurate drum scheduling on audio clock  
    https://webaudio.github.io/web-audio-api/#AudioBufferSourceNode · GitHub: `WebAudio/web-audio-api`

108. **Tone.js Param / Gain automation** — GitHits `Tone/core/context/Param.ts`; sidechain duck via gain ramps  
    https://github.com/Tonejs/Tone.js · see also #96

109. **Procedural drum lane + sidechain duck** — `lib/song/drums/`, `SidechainDef`, `duckGain` per layer  
    `docs/research/song-drums-sidechain-phase3.md` · riddim grid (#56, #91) · duck depth (#61, #118)

## Research loop — arrangement agents phase 87 (2026-06-16)

110. **Tone.js Pattern + PatternGenerator** — GitHits `Tone/event/Pattern.ts`; cyclic note pools for PatternAgent IR  
    https://github.com/Tonejs/Tone.js

111. **@tonejs/midi** — SMF ↔ JSON interchange (130k dl/mo); optional export path, not runtime scheduler  
    https://github.com/Tonejs/Midi · npm `@tonejs/midi@2.0.28`

112. **@tonaljs/tonal** — scale degrees, key-aware note names for deterministic bass MIDI (#112)  
    https://github.com/tonaljs/tonal · `Progression`, `Scale.degrees`

113. **@strudel/core** — Tidal stack/cat/slow semantics; **AGPL** — IR port only, no runtime embed  
    https://codeberg.org/uzu/strudel · see #76, #79

114. **LangGraph agent patterns** — supervisor + specialist routing; structured run state  
    https://github.com/langchain-ai/langgraph · mapped to ArrangementRun events

115. **Mix agent pipeline** — analyze → propose → lint → apply template for all sub-agents  
    `lib/song/mix/`, `docs/research/song-mix-agent-phase2.md`

116. **Arrangement agent architecture** — hierarchical sub-agents, rule packs, song UI  
    `docs/research/arrangement-agent-landscape.md` · `lib/schemas/agents.ts` · `.planning/phases/87-arrangement-agent-ui/`
