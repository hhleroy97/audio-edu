# Phase 73 — Advanced LFO & Macro Node

**Goal:** Movement density pros expect — S&H LFO, key-tracked rate, macro fan-out, sharper custom curves.

**Depends on:** Phase 71

---

## Tasks

### 1. LFO sample-hold (`lib/patch/lfo-curve.ts`, `runtime-nodes.ts`)

- Add shape `sampleHold` — hold last value until phase step (quantize phase to N steps)
- UI option in `LFO_SHAPE_OPTIONS`
- Preset: riddim stutter uses `custom` today; add `sampleHold` as first-class

### 2. Key-tracked LFO rate (`lib/patch/transport.ts`)

- New param `keyTrack: boolean` on LFO node
- On note-on, pass `noteFreq` from engine → scale `resolveLfoRateHz` by `noteFreq / refFreq` (ref = 110 Hz or middle C)
- Document in theory: Transmission Samples reese guide (source #49)

### 3. Richer PeriodicWave (`lib/patch/lfo-curve.ts`)

- Increase `HARMONICS` from 32 → 64 for sharper custom stutter edges
- Test: square-like custom curve SNR vs prior

### 4. Macro node (new `NodeKind: "macro"`)

**Ports:** none audio; `cv-out` only (constant value)

**Params:** `value` 0…1, up to 4 virtual targets via mod matrix edges from macro

**Runtime:** `ConstantSourceNode` → gain → multiple CV outs OR single out fanned in matrix

**Simpler v1:** Macro node exposes one `cv-out`; user patches macro → multiple targets with different edge depths (Serum macro = same)

**UI:** One big knob; label "MACRO"

**Files:**
- `lib/patch/runtime-nodes.ts` — `createMacroRuntime`
- `lib/patch/nodes.tsx`, `module-controls.ts`, `module-theme.ts`, `ports` layout
- `lib/patch/store.ts` — palette unlock

### 5. Dual-LFO wiring helpers

- `lib/patch/presets/helpers/dualLfoGrowl.ts` — template patch fragment
- Not a new node — documentation + preset factory

### 6. Tests

- `tests/lfo-curve.test.ts` — sampleHold sampling, harmonics count
- `tests/patch-macro.test.ts` — macro CV level follows param
- Update `tests/patch-presets.test.ts` count

### 7. Docs & graph

- `docs/research/riddim-synthesis.md` — macro + key-track section
- Graph nodes: `component:macro`, `technique:dual-lfo-chain`
- `graph/research/riddim-supplement.json` update

---

## Verification

Preset `pro-dual-lfo-growl`: LFO1 1/4 → cutoff, LFO2 1/8 half-rate → FM index — audible non-repeating motion.

---

## Commit

```
feat(patch): macro CV source, sample-hold LFO, and key-tracked LFO rate.

Unlocks Serum-style macro performance and evolving riddim growls without leaving the node graph.
```
