# Theory — Pitch Envelopes

## Envelopes as time-varying control

An **[[envelope]]** is a control signal that evolves over the duration of a
note. The classic **[[adsr]]** model defines four stages:

| Stage   | Meaning                                      |
|---------|----------------------------------------------|
| Attack  | Time to reach peak from note-on              |
| Decay   | Time to fall from peak to sustain level      |
| Sustain | Held level while key is pressed              |
| Release | Time to fall to zero after note-off          |

When applied to **[[pitch]]** (oscillator frequency) instead of amplitude, each
stage bends the perceived note — not just its loudness.

## Pitch envelope vs. amplitude envelope

- **Amplitude ADSR** — shapes loudness; defines transient punch and tail length.
- **Pitch ADSR** — shapes frequency; defines pluck bend, drop, or sweep character.

Both can run simultaneously on the same note. RIDDIM bass design often pairs a
fast pitch decay with a slower amplitude release for aggressive transient +
sustained sub.

## Reading pitch movement on the spectrograph

The scrolling spectrograph makes pitch envelopes **visible**: a downward pitch
decay appears as a descending bright band at note-on. Compare envelope shapes
by watching how quickly the band moves and where it settles.

## Related concepts

- [[envelope]] — time-varying control signal
- [[pitch]] — perceived frequency of a tone
- [[adsr]] — attack/decay/sustain/release model
- [[unison]] — prior experiment; detuned voices under pitch modulation

Prerequisite: [02-unison](../../02-unison/experiment.md). Next:
[04-wavetable](../../04-wavetable/experiment.md).
