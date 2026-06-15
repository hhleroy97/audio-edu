---
title: "Pitch Envelopes"
description: "Shape pitch over time with ADSR-style envelopes for plucks, sweeps, and bass drops."
slug: "03-pitch-envelopes"
order: 3

learningObjectives:
  - "Describe how an envelope modulates pitch over time"
  - "Identify attack, decay, sustain, and release stages on a pitch sweep"
  - "Relate pitch envelope shape to transient character on the spectrograph"
prerequisites:
  - "02-unison"
difficulty: 2
estimatedMinutes: 12
concepts:
  - envelope
  - pitch
  - adsr

author: "Hartley LeRoy"
version: "0.1.0"
changelog:
  - "0.1.0 — initial draft"
compatibility:
  requiresAudioPlayback: true
  mobileFriendly: true
summary: >
  Introduces pitch modulation via ADSR-style envelopes applied to oscillator
  frequency. Learner shapes attack and decay to create plucks, drops, and sweeps
  while observing pitch movement on the spectrograph — bridging static tones and
  time-varying timbre.
---

# Pitch Envelopes

Amplitude [[envelope]]s are familiar; **pitch envelopes** apply the same
time-shaping logic to [[pitch]]. A fast attack that sweeps frequency downward
creates the classic bass-drop transient; a slow decay yields evolving drones.

## What you'll hear

- **Fast attack, short decay** — percussive pluck with pitch bend.
- **Slow attack** — gradual pitch rise into a sustained note.
- **Release tail** — pitch glides as the note fades.

Builds on [02-unison](../02-unison/experiment.md). Next:
[04-wavetable](../04-wavetable/experiment.md).
