---
title: "Oscillator Basics"
description: "Generate raw tones and see their frequency content in real time."
slug: "01-oscillator"
order: 1

learningObjectives:
  - "Identify the four core waveforms by sight and sound"
  - "Relate frequency to perceived pitch"
  - "Read an FFT display to see harmonic content"
prerequisites: []
difficulty: 1
estimatedMinutes: 8
concepts:
  - oscillator
  - waveform
  - frequency
  - amplitude
  - fft

author: "Hartley LeRoy"
version: "0.1.0"
changelog:
  - "0.1.0 — initial draft"
compatibility:
  requiresAudioPlayback: true
  mobileFriendly: true
summary: >
  Introduces the oscillator as the fundamental sound source. Learner selects a
  waveform, adjusts frequency and amplitude, and observes the resulting spectrum
  on a live FFT display — establishing the visual vocabulary reused throughout.
---

# Oscillator Basics

The oscillator is the atomic sound source in subtractive synthesis. Every RIDDIM
bass, pad, and texture starts here: a periodic waveform repeating at some
frequency, shaped and filtered downstream.

## What you'll hear

- **Sine** — a pure tone; one peak on the FFT.
- **Square / saw** — odd or all harmonics; the harmonic "fingerprint" of each shape.
- **Triangle** — softer than square; odd harmonics that fall off faster.

Sweep frequency and watch the FFT peak move. This is the visual vocabulary for
every experiment that follows.

See [[frequency]] and [[waveform]] in the knowledge graph; next up:
[02-unison](../02-unison/experiment.md).
