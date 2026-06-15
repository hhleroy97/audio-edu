---
title: "Layering"
description: "Combine multiple oscillators with independent timbres into a single cohesive patch."
slug: "06-layering"
order: 6

learningObjectives:
  - "Combine two or more oscillator layers with independent level and timbre"
  - "Identify each layer's contribution on the FFT"
  - "Apply filtering to the summed output of a multi-oscillator patch"
prerequisites:
  - "05-filtering"
difficulty: 4
estimatedMinutes: 16
concepts:
  - layering
  - multi-oscillator

author: "Hartley LeRoy"
version: "0.1.0"
changelog:
  - "0.1.0 — initial draft"
compatibility:
  requiresAudioPlayback: true
  mobileFriendly: true
summary: >
  Culminates the Phase-1 arc by stacking multiple oscillator layers — each with
  independent waveform, level, and optional unison — through a shared filter.
  Learner balances sub, body, and top layers while reading the combined spectrum
  on the FFT, mirroring real-world bass patch construction.
---

# Layering

Professional patches rarely use one source. **[[layering]]** stacks multiple
**[[multi-oscillator]]** voices — sub, body, and top — each contributing a
different frequency band and timbre. A shared [[filter]] glues the stack into
one cohesive sound.

## What you'll hear

- **Sub layer** — sine or filtered saw an octave down; fills the low end.
- **Body layer** — detuned unison for thickness in the mid-lows.
- **Top layer** — bright wavetable or filtered noise for presence.

Builds on [05-filtering](../05-filtering/experiment.md). This completes the
Phase-1 subtractive arc.
