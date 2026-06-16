# Phase 75 — Workflow P3 (Stretch)

**Goal:** Remaining P3 items from `riddim-feature-roadmap.md` that pros use in DAW workflow but Patch Lab lacks.

**Depends on:** Phase 74 (stable pro modulation baseline)

**Priority:** Execute only after 71–74 verified. Can split into 75a/75b if scope too large.

---

## Scope (pick all or subset)

| # | Feature | Effort | Files |
|---|---------|--------|-------|
| 16 | **Resample / bounce node** | Large | `runtime-nodes.ts`, MediaRecorder tap, new `sample` node |
| 18 | **Spectral descriptors on scope** | Medium | `lib/viz/`, centroid/brightness from AnalyserNode |
| 20 | **Transport halftime grid** | Medium | `PatchTransportPanel.tsx`, BPM + bar display |
| 17 | **M/S mono bass** | Small | `layerStack` or output node M/S matrix |

---

## Recommended order

### 75a — Resample node (highest pedagogical value)

1. `AnalyserNode` or `MediaStreamDestination` records N seconds from patch tap
2. New node `sampler` plays buffer with gate
3. Preset: Subtronics-style chop workflow (EDMProd source #5)
4. Lesson 08 stub

**Commit:** `feat(patch): resample node for iterative bass design`

### 75b — Scope descriptors

1. Compute spectral centroid + RMS from existing FFT buffer
2. Overlay on `Oscilloscope` / spectrum panel
3. Link to arXiv:2302.13542 in docs

**Commit:** `feat(viz): spectral centroid and loudness overlays on scope`

### 75c — Transport grid

1. Visual 1/2 1/4 grid under transport BPM
2. LFO sync divisions highlight on beat

**Commit:** `feat(patch): halftime grid on transport panel`

---

## Verification

- Resample: record wobble → drop sample node → hear loop
- Descriptors: centroid drops when LP cutoff lowered
- Grid: LFO 1/4 aligns with visual beat markers at 140 BPM

---

## Docs

- Mark P3 items in `riddim-feature-roadmap.md`
- Graph: `technique:resample-workflow` edge to new `component:sampler`
