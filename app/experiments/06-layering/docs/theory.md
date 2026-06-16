# Theory — Layering

## Why layer?

A single [[oscillator]] — even with [[unison]] and [[wavetable]] morphing — may
not cover the full frequency spectrum a mix demands. **[[layering]]** assigns
different roles to parallel sources:

| Layer | Typical source        | Role                          |
|-------|-----------------------|-------------------------------|
| Sub   | Sine, octave down     | Felt low-end, mono-safe       |
| Body  | Detuned saw/unison    | Mid-low thickness and movement|
| Top   | Bright wavetable/noise| Presence and bite             |

Each layer is an independent voice in a **[[multi-oscillator]]** architecture,
summed before or after shared processing.

## Summing and headroom

Layers sum at the mixer bus. Without per-layer [[amplitude]] control, clipping
is likely — especially when multiple bright sources stack. The FFT helps diagnose
which layer dominates: mute layers individually and watch peaks disappear.

## Shared filter as glue

From experiment 05, a single **[[filter]]** on the summed output ties layers
together. Cutoff and [[resonance]] shape the combined timbre; per-layer filters
are an advanced extension outside this experiment's scope.

## Phase and mono compatibility

Detuned layers (experiment 02) can cause phase cancellation in mono. Keep the sub
layer monophonic and centered; pan wider layers cautiously.

## Multibus songs (Patch Lab)

The song engine runs **three parallel preset graphs** (sub / body / top) into a master bus.
Each graph is a full Patch Lab preset — not a single oscillator from this experiment's UI.

| Layer | Typical preset family | Agent rule |
|-------|----------------------|------------|
| Sub | `clean-sub`, sine FM | No wobble CV on sub; monophonic roots only |
| Body | `hydraulic-press-wobble`, `reese-riddim-body` | Carries wobble + **chord dyads** (phases 116–117) |
| Top | `pro-metallic-comb`, noise fizz | Drops/build only; HPF > 2 kHz |

**Energy model:** Adding body increases groove motion in the 100–800 Hz band; adding top
increases aggression above 800 Hz. Removing layers thins the mix predictably — see
[`docs/theory/layer-energy-model.md`](../../../../docs/theory/layer-energy-model.md).

## Related concepts

- [[layering]] — stacking complementary oscillator roles
- [[multi-oscillator]] — parallel voice architecture
- [[filter]] — shared timbral glue on the summed output
- [[unison]] — thickness within individual layers

Prerequisite: [05-filtering](../../05-filtering/experiment.md). End of Phase-1 arc.
