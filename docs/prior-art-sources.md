# Prior Art Sources — Node-Graph UI Overhaul

> Provenance for architectural decisions in the patch lab (`/lab`). See `UI_OVERHAUL_HANDOFF.md`.

## References (GitHits-indexed)

| Source | What we borrowed | Evidence |
|--------|------------------|----------|
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | React Flow store ↔ Web Audio reconcile pattern; `applyNodeChanges` / `applyEdgeChanges` with zustand | GitHits solution `5f5ec8dc-5984-4d74-92ec-a8f05b3a56e3` |
| [k1ln/synflow](https://github.com/k1ln/synflow) | `AudioGraphManager` connection trees (`sourceNodeMapConnectionTree`, `targetNodeMapConnectionTree`), virtual node lifecycle, typed handle → `AudioParam` routing | `packages/core/src/AudioGraphManager.ts` |
| [rsimmons/plinth](https://github.com/rsimmons/plinth) | Serializable rack `save()` / block map model for `Patch` persistence | `src/blocks/rack/index.js` `save()` |
| [reactflow.dev tutorial](https://reactflow.dev/learn/tutorials/react-flow-and-the-web-audio-api) | Canonical canvas + zustand + nanoid skeleton (bleep.cafe pattern) | Listed in `UI_OVERHAUL_HANDOFF.md` §2 |
| [audiomotion-analyzer](https://www.npmjs.com/package/audiomotion-analyzer) | Candidate FFT spectrum view (deferred — hand-rolled axes first) | `UI_OVERHAUL_HANDOFF.md` §6 |
| [react-joyride](https://react-joyride.com) | Guided tour step callbacks for `explain` / `demo` / `do` steps | `UI_OVERHAUL_HANDOFF.md` §7 |

## Architecture rules adopted (SynthEngineer blog)

- Connection registry with cycle validation before `connect()`
- `audioContext.currentTime` as clock; `setTargetAtTime` for param smoothing
- Separate UI graph (React Flow) and audio graph (`AudioNode`s)
