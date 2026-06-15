# Theory — Oscillator Basics

## The oscillator as sound atom

An **oscillator** produces a repeating waveform at a fundamental frequency *f*.
Perceived pitch scales logarithmically with *f* — doubling frequency raises pitch
by one octave.

## Waveforms and harmonics

| Waveform   | Harmonic series        | Timbral character      |
|------------|------------------------|------------------------|
| Sine       | Fundamental only       | Pure, hollow           |
| Square     | Odd harmonics          | Hollow, clarinet-like  |
| Sawtooth   | All harmonics          | Bright, buzzy          |
| Triangle   | Odd, fast roll-off     | Soft, flute-like       |

RIDDIM bass design often starts with **saw** or **square** sources precisely
because their rich harmonic content survives aggressive filtering and FM
modulation later in the arc.

## FFT as teaching tool

The Fast Fourier Transform decomposes a time-domain signal into frequency bins.
Each bin's magnitude corresponds to energy at that frequency — making the
"invisible" harmonic structure **visible**. This experiment establishes FFT +
spectrograph as always-on diagnostics.

## Related concepts

- [[frequency]] — pitch perception and Hz
- [[waveform]] — periodic shapes
- [[amplitude]] — perceived loudness vs. peak level
- [[fft]] — spectral analysis

Prerequisite for [02-unison](../02-unison/experiment.md).
