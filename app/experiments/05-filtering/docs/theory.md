# Theory — Filtering

## Subtractive synthesis

**Subtractive synthesis** starts with a harmonically rich source and removes
( subtracts ) frequency content with a **[[filter]]**. The low-pass filter (LPF)
is the workhorse: it passes frequencies below the **[[cutoff]]** and attenuates
those above.

## Cutoff and the FFT

Sweeping cutoff on a saw or wavetable source:

| Cutoff position | FFT appearance                    |
|-----------------|-----------------------------------|
| Low             | Harmonics above cutoff vanish     |
| Mid             | Partial series truncated          |
| High (open)     | Full harmonic content preserved   |

The FFT makes subtractive filtering **visible**: peaks above cutoff shrink as
the filter closes.

## Resonance (Q)

**[[resonance]]** (quality factor *Q*) feeds back energy at the cutoff
frequency, creating a peak in the filter's transfer function. Audibly this adds
a whistling emphasis; on the FFT it appears as a localized bump at cutoff.
Extreme resonance can self-oscillate, producing a sine-like tone at cutoff even
without input.

## Filter envelope (preview)

Experiment 03's [[envelope]] concept applies equally to cutoff — a filter
envelope creates classic synth sweeps. Full filter-envelope routing is a natural
extension after this experiment's static cutoff/resonance controls.

## Related concepts

- [[filter]] — frequency-selective processing
- [[cutoff]] — corner frequency of the filter
- [[resonance]] — emphasis at cutoff (Q factor)
- [[timbre]] — prior experiment; filtering reshapes timbre

Prerequisite: [04-wavetable](../../04-wavetable/experiment.md). Next:
[06-layering](../../06-layering/experiment.md).
