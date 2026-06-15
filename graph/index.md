# Synthesis Learning Lab — Knowledge Graph Index

> Karpathy-pattern index for the Understand Anything–style deterministic parser.
> Categories map to `##` sections; experiment links use CommonMark `[label](path.md)`.

## Phase One — RIDDIM Sound Design Arc

- [01-oscillator](../app/experiments/01-oscillator/experiment.md) — Waveforms, frequency, amplitude
- [02-unison](../app/experiments/02-unison/experiment.md) — Voice stacking, detune, stereo spread
- [03-pitch-envelopes](../app/experiments/03-pitch-envelopes/experiment.md) — ADSR pitch shaping
- [04-wavetable](../app/experiments/04-wavetable/experiment.md) — Timbre morphing
- [05-filtering](../app/experiments/05-filtering/experiment.md) — Cutoff, resonance, subtractive shaping
- [06-layering](../app/experiments/06-layering/experiment.md) — Multi-oscillator stacks

## Core Concepts

- [[oscillator]] — periodic sound source
- [[waveform]] — sine, square, saw, triangle
- [[frequency]] — pitch in Hz
- [[amplitude]] — level / loudness
- [[fft]] — spectral analysis
- [[unison]] — detuned voice stacking
- [[envelope]] — time-varying parameter shaping
- [[filter]] — subtractive frequency sculpting
- [[layering]] — parallel oscillator stacks

## Shared Infrastructure

- [lib/audio](../../lib/audio/index.ts) — synthesis utilities
- [lib/viz](../../lib/viz/index.ts) — FFT, spectrograph, waveform renderers
- [lib/ui](../../lib/ui/index.ts) — progressive-disclosure UI shell

## Automation

Graph output: `graph/.understand/knowledge-graph.json`  
Extract: `npm run graph:extract`  
Validate metadata: `npm run validate:metadata`
