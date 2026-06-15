---
title: "Filtering"
description: "Sculpt timbre with cutoff and resonance — the core of subtractive synthesis."
slug: "05-filtering"
order: 5

learningObjectives:
  - "Explain low-pass filtering as harmonic subtraction"
  - "Relate cutoff frequency to the FFT rolloff point"
  - "Describe how resonance emphasizes frequencies near cutoff"
prerequisites:
  - "04-wavetable"
difficulty: 3
estimatedMinutes: 14
concepts:
  - filter
  - cutoff
  - resonance

author: "Hartley LeRoy"
version: "0.1.0"
changelog:
  - "0.1.0 — initial draft"
compatibility:
  requiresAudioPlayback: true
  mobileFriendly: true
summary: >
  Introduces subtractive filtering: a low-pass filter removes harmonics above
  cutoff while resonance boosts energy at the cutoff point. Learner sweeps cutoff
  and resonance on a rich source, watching harmonic removal in real time on the
  FFT — the defining step of subtractive synthesis.
---

# Filtering

Rich sources from [[wavetable]] or [[oscillator]] layers contain many
harmonics. A **[[filter]]** removes frequencies above the **[[cutoff]]** —
literally subtracting timbral content. **[[resonance]]** boosts the band at
cutoff, adding character and emphasis.

## What you'll hear

- **Low cutoff** — dark, muffled tone; fewer FFT peaks above cutoff.
- **High cutoff** — bright, open tone; full harmonic series restored.
- **High resonance** — whistling peak at cutoff; visible bump on the FFT.

Builds on [04-wavetable](../04-wavetable/experiment.md). Next:
[06-layering](../06-layering/experiment.md).
