# Theory — Unison & Detuning

## Why stack voices?

Subtractive synthesis often needs more energy and width than one [[oscillator]]
can provide. **Unison** runs multiple copies of the same source in parallel,
each with a small [[detune]] offset (typically ± cents, not semitones).

When two periodic signals differ slightly in frequency, their amplitudes
interfere — producing **beating**: a slow amplitude modulation at the
difference frequency. At low detune amounts this reads as warmth; at higher
amounts the timbre becomes diffuse.

## Detune in cents

Detune is measured in **cents** (1/100 of a semitone). Common ranges:

| Detune (cents) | Perceived effect              |
|----------------|-------------------------------|
| 5–15           | Subtle chorus, gentle beating |
| 15–40          | Noticeable thickness          |
| 40+            | Dissonant smear, chord-like   |

## Stereo spread

Panning unison voices across the stereo field creates [[stereo-spread]]. In
mono fold-down, correlated low-frequency content may cancel or reinforce —
an important mix consideration for bass-heavy genres like RIDDIM.

## Related concepts

- [[unison]] — parallel voice stacking
- [[detune]] — micro-tuning offsets between voices
- [[stereo-spread]] — spatial distribution of detuned voices
- [[oscillator]] — prerequisite sound source

Prerequisite: [01-oscillator](../../01-oscillator/experiment.md). Next:
[03-pitch-envelopes](../../03-pitch-envelopes/experiment.md).
