# Layer energy & spectral slotting

> **Scope:** Multibus song agents + Patch Lab layering pedagogy.  
> **Sources:** #2 Preset Drive riddim guide, #7 experiment 06, #47 multiband layering,
> #64 DSF riddim thread, #135 EDM Templates phase cancellation, #136 melodic dubstep harmony.

---

## Three-band model

Riddim mixes treat the bass stack as **three frequency slots**, not three copies of the
same patch:

| Slot | Hz range (typical) | Role | Energy type |
|------|-------------------|------|-------------|
| Sub | 20–100 | Felt foundation, mono | **Physical** — chest, club subs |
| Body | 100–800 | Harmonic motion, wobble | **Groove** — halftime identity, chord color |
| Top | 800–4000+ | Fizz, screech, noise | **Aggression** — ear presence, fatigue if loud |

Each slot should carry **different synthesis techniques** (sine sub, detuned saw/FM body,
noise/wt top) — see `docs/research/riddim-sound-catalog.md` §5.

---

## What happens when you add a layer?

### Sub only

- **Spectrum:** Energy concentrated below ~100 Hz; FFT shows single fundamental.
- **Mix:** Maximum headroom in mids; kick and sub share low band — sidechain matters.
- **Harmony:** Monophonic roots only; no chord color (by design in riddim minimalism #64).

### Sub + body

- **Spectrum:** Mid harmonics from filter motion and FM; wobble visible as moving centroid.
- **Energy:** Perceived “pocket” and genre identity; drop feels complete vs intro.
- **Harmony:** Body can carry **dyads/triads** in mid band while sub holds root (#136).
- **Risk:** Body bleeding below 80 Hz muds sub — HP body @ 80–100 Hz (#2).

### Sub + body + top

- **Spectrum:** High-band noise/comb partials; scope shows bright transients.
- **Energy:** Peak drop intensity; headphones feel “sick” / aggressive.
- **Risk:** Phase cancellation if body unison is wide (#135); keep sub mono (#2).

### Removing a layer (A/B)

| Remove | You lose | You gain |
|--------|----------|----------|
| Sub | Weight, club translation | Clarity on laptop speakers |
| Body | Motion, harmonic movement | Minimal / techno-adjacent flatness |
| Top | Harshness, air | Cleaner, less fatiguing mids-highs |

Song agents use these tradeoffs: **intro/break** mute body/top; **build** adds top; **drop**
runs full stack (`TimbreAgent` section kinds).

---

## Chords vs monophonic riddim

Classic riddim is **monophonic** in the body (#64). User-facing songs target **richer harmony**
(melodic dubstep adjacency #136):

- **Sub:** always monophonic root — never stack fifth on sub layer.
- **Body:** stack root + fifth (+ optional third) in 100–400 Hz — requires **polyphonic
  layer voices** (phase 116) and multi-note pattern IR (phase 117).
- **Top:** optional chord-aware stab or offbeat single — does not define harmony.

---

## Timbre selection (not random)

Preset choice should follow **synthesis role**, not uniform random:

1. Match `spectralBand` to layer id (sub/body/top).
2. Match `motionClass` to section kind (intro static, drop dual-lfo).
3. Enforce catalog diversity across sections (phase 118 scoring).

See `docs/research/chords-polyphony-milestone-116-121.md` for agent design.

---

## Automation & phrase energy

Phrase slots (A/B/C/D) change **rhythmic** energy (#111). Beat-aware automation (phase 120)
maps slots to **timbral** energy:

- Fill bar → filter open + send delay bump
- Hat-roll bar → macro comb depth up
- Triad bar → shorter body gate (hydraulic chop #134)

All curves remain deterministic from `seed` — no ML randomness.

---

## Related docs

- `app/experiments/06-layering/docs/theory.md`
- `docs/research/riddim-sound-catalog.md`
- `docs/research/chords-polyphony-milestone-116-121.md`
