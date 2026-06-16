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
