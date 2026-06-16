# Phase 72 — Live Mod Preview

**Goal:** When a param is CV-driven, the knob/slider shows the **effective value** moving in real time (audio-nodes `useLiveParamModulation` pattern).

**Depends on:** Phase 71 (stable CV routing)

---

## Tasks

### 1. Mod preview bus (`lib/patch/mod-preview.ts` — new)

- `ModPreviewBus` singleton on `AudioEngine`
- Each CV wire: `AnalyserNode` or `AudioWorklet` meter on `depthGain` output — **prefer lightweight approach:**
  - `requestAnimationFrame` loop reading `param.value` via `param.value` (Web Audio reflects computed value when connected)
  - Fallback: small ScriptProcessor deprecated — use `param.value` polling @ 30fps when gate open

### 2. Engine hook (`lib/patch/audio-engine.ts`)

- After wiring CV, register `(targetNodeId, paramHandle, AudioParam)` in preview bus
- On `setParams`, emit preview update
- On dispose, unregister

### 3. React hook (`lib/patch/useLiveParamModulation.ts`)

Mirror audio-nodes API:

```ts
useLiveParamModulation(nodeId, paramKey, isCvConnected): number | undefined
```

- Subscribe to engine events / rAF
- Return `undefined` when not modulated → knob shows static value

### 4. Node UI (`lib/patch/nodes.tsx`)

For filter cutoff, FM index, LFO depth targets:

- When CV connected to handle, show ghost ring or secondary readout in `text-cold`
- Disable manual input OR show "mod" badge (don't fight automation)

### 5. Tests

- `tests/patch-mod-preview.test.ts`: mock AudioParam with connected value
- Integration: connect LFO → cutoff, assert hook returns oscillating value (mock ctx)

### 6. Docs

- `docs/research/pro-modulation-plan.md` — phase 72
- `UI_OVERHAUL_HANDOFF.md` — note live mod readout under mod matrix section

---

## Verification

Manual: patch LFO → filter cutoff, watch cutoff readout move while dragging base cutoff.

---

## Commit

```
feat(patch): live effective-value preview on CV-modulated parameters.

Matches pro synth UX where modulated knobs show real output, not just static base values.
```
