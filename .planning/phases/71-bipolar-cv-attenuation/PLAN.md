# Phase 71 — Bipolar CV & Attenuation

**Goal:** CV cables behave like Serum mod matrix entries: signed depth (attenuverter) and DC offset so LFO can push params above and below base value.

**Grounding:** arXiv:2510.06204; synflow `Gain[amount]`; envelope `cvSign` already bipolar on source — extend to **edge-level** control.

---

## Context

Today (`lib/patch/audio-engine.ts`):

```ts
depthGain.gain.value = wire.modDepth; // 0..2 unipolar only
out.connect(depthGain);
depthGain.connect(param);
```

Web Audio `AudioParam` **adds** connected signals to `param.value`. Bipolar modulation requires:
- `effective = base + offset + depth * lfoSignal`
- LFO osc outputs −1…+1 via `depthGain`; base stays on param.

---

## Tasks

### 1. Schema (`lib/schemas/patch.ts`)

Extend React Flow edge data (store layer, not PatchEdge preset schema):

```ts
// store edge.data
modDepth: number;   // −1..1 (breaking: remap UI from 0..2)
modOffset: number;  // −1..1 normalized offset added via ConstantSource
modBipolar: boolean; // if false, rectified to 0..1 (legacy unipolar)
```

Add Zod for runtime edge data in `lib/schemas/patch-edge-data.ts` (new) — validate on save/load.

### 2. Audio engine (`lib/patch/audio-engine.ts`)

For each CV wire:

```
LFO → depthGain (bipolar depth) → sumGain
ConstantSource (offset) ──────────┘ → param
```

- If `!modBipolar`: `Math.max(0, lfo)` via waveshaper or `Math.max` in custom gain (use `WaveShaperNode` with `max(0,x)` curve)
- Track `ConstantSourceNode` + gains in `cvWireGains` for teardown
- Respect `sub-protection.ts` — block CV to protected sub paths (existing)

### 3. Mod matrix UI (`lib/patch/PatchModMatrix.tsx`)

Per route row:

- Depth slider **−1…+1** (label: depth)
- Offset slider **−1…+1** (label: offset)
- Bipolar toggle (default on for new edges)

### 4. Store (`lib/patch/store.ts`)

- Default edge data: `{ modDepth: 0.5, modOffset: 0, modBipolar: true }`
- `updateModOffset(edgeId, value)`
- `updateModBipolar(edgeId, value)`
- Migrate existing edges: `modDepth > 1 ? modDepth / 2 : modDepth` on load

### 5. Tests

- `tests/patch-mod-routing.test.ts` (new):
  - Edge data Zod validation
  - Bipolar vs unipolar shaping function (unit)
  - Preset load with negative `modDepth` on pitch-bite path

### 6. Docs

- `docs/research/pro-modulation-plan.md` — mark 71 complete
- `app/experiments/05-filtering/docs/theory.md` — add paragraph on bipolar LFO → cutoff
- `CHANGELOG.md` unreleased bullet

### 7. Graph

- Add edge `technique:wobble-lfo-cutoff` → `concept:attenuverter` in `graph/research/riddim-supplement.json`
- `npm run graph:extract -- --force`

---

## Verification

```bash
npm test -- --run tests/patch-mod-routing.test.ts tests/patch-presets.test.ts
npm run dev  # manual: LFO → filter cutoff, depth −0.8, hear inverted wobble
```

**UAT:** Load `wobble-stub`, set LFO depth negative — cutoff should wobble opposite direction.

---

## Commit

```
feat(patch): bipolar CV depth, offset, and unipolar legacy mode on mod routes.

Producers need signed modulation on filter, pitch, and FM index; edge-level attenuation matches Serum matrix behavior without new node types.
```

**Do not push** until user asks (per user rules) — plan only notes commit point.
