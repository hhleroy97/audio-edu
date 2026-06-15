# Theory — Wavetable Modulation

## What is wavetable synthesis?

**[[wavetable]]** synthesis stores a sequence of single-cycle waveforms (table
frames) in memory. Playback reads consecutive samples from the active frame;
**[[morph]]**ing crossfades between adjacent frames as **table position**
changes.

Unlike a static [[oscillator]] shape, table position gives continuous **[[timbre]]**
control without changing fundamental frequency.

## Table position and harmonics

Each frame has a distinct harmonic fingerprint. Scrubbing position:

| Position change | FFT effect                          |
|-----------------|-------------------------------------|
| Frame A → B     | Harmonic peaks shift and crossfade  |
| Slow modulate   | Timbral evolution over time         |
| Fast modulate   | Metallic, inharmonic sidebands      |

## Envelope-driven morph

Routing an [[envelope]] to table position (from experiment 03) creates evolving
timbres: bright attack fading to a darker sustain, or vice versa. This decouples
timbre motion from [[pitch]] motion.

## Related concepts

- [[wavetable]] — bank of crossfaded single-cycle frames
- [[timbre]] — spectral character beyond pitch and loudness
- [[morph]] — crossfade between adjacent table frames
- [[envelope]] — prior experiment; modulates position over time

Prerequisite: [03-pitch-envelopes](../../03-pitch-envelopes/experiment.md). Next:
[05-filtering](../../05-filtering/experiment.md).
