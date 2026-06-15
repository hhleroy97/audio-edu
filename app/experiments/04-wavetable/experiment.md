---
title: "Wavetable Modulation"
description: "Morph between stored waveforms to sculpt timbre beyond basic shapes."
slug: "04-wavetable"
order: 4

learningObjectives:
  - "Explain wavetable synthesis as crossfading between periodic snapshots"
  - "Relate table position to harmonic content on the FFT"
  - "Use an envelope to modulate wavetable position over time"
prerequisites:
  - "03-pitch-envelopes"
difficulty: 3
estimatedMinutes: 14
concepts:
  - wavetable
  - timbre
  - morph

author: "Hartley LeRoy"
version: "0.1.0"
changelog:
  - "0.1.0 — initial draft"
compatibility:
  requiresAudioPlayback: true
  mobileFriendly: true
summary: >
  Introduces wavetable synthesis: a bank of single-cycle waveforms crossfaded
  by table position. Learner scrubs and modulates position to morph timbre while
  observing harmonic changes on the FFT — expanding beyond the four static
  waveforms from experiment 01.
---

# Wavetable Modulation

Static [[waveform]]s are a starting point; **[[wavetable]]** synthesis stores
many single-cycle snapshots and **[[morph]]**s between them. Table position
controls [[timbre]] independently of pitch — a core technique in modern bass
and lead design.

## What you'll hear

- **Low table position** — darker, simpler harmonic content.
- **High table position** — brighter, more complex spectra.
- **Modulated position** — evolving timbre over the note duration.

Builds on [03-pitch-envelopes](../03-pitch-envelopes/experiment.md). Next:
[05-filtering](../05-filtering/experiment.md).
