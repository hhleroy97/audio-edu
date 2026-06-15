---
title: "Unison & Detuning"
description: "Stack detuned voices for width, thickness, and stereo spread."
slug: "02-unison"
order: 2

learningObjectives:
  - "Explain how detuning creates beating and perceived thickness"
  - "Relate unison voice count to spectral smearing on the FFT"
  - "Pan detuned voices for stereo width without losing mono compatibility"
prerequisites:
  - "01-oscillator"
difficulty: 2
estimatedMinutes: 10
concepts:
  - unison
  - detune
  - stereo-spread

author: "Hartley LeRoy"
version: "0.1.0"
changelog:
  - "0.1.0 — initial draft"
compatibility:
  requiresAudioPlayback: true
  mobileFriendly: true
summary: >
  Extends the single oscillator with multiple detuned voices panned across the
  stereo field. Learner adjusts voice count, detune amount, and spread while
  watching how beating and spectral smearing appear on the FFT — the first step
  toward thick bass and pad textures.
---

# Unison & Detuning

A single [[oscillator]] sounds focused and narrow. **Unison** duplicates that
source into several voices, each slightly detuned from the others. The result is
perceived thickness, subtle beating, and — when panned — [[stereo-spread]].

## What you'll hear

- **Low detune** — gentle chorus-like warmth; slow beating.
- **High detune** — dense, almost chord-like smearing on the FFT.
- **Stereo spread** — voices panned left/right; check mono fold-down behavior.

Builds on [01-oscillator](../01-oscillator/experiment.md). Next:
[03-pitch-envelopes](../03-pitch-envelopes/experiment.md).
