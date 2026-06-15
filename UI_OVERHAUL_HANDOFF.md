# UI_OVERHAUL_HANDOFF.md — Node-Graph Education System

> **Supersedes the presentation layer** described in `HANDOFF.md`. The linear, document-style
> lesson format is replaced by a **React Flow node-graph canvas** where learners patch audio
> nodes together with cables (modular-synth style) and *hear* what they wire. Education is
> delivered as a **TurboTax-style guided walkthrough** layered on top of the canvas.
>
> **What stays unchanged:** the metadata/`docs/` source-of-truth, the Zod-validated contracts,
> the knowledge graph, the RIDDIM Phase One concept arc, and the dark-brutalist palette
> (see `HANDOFF.md`, `AGENTS.md`, `METADATA_SCHEMA.md`). Those still drive content; only the
> *delivery surface* changes.

---

## 1. Core idea

A learner doesn't read about an oscillator — they drop an **Oscillator node** on a canvas, drag a
**cable** from its output into a **Filter** node, drag the filter into the **Output**, and hear it.
A guided walkthrough highlights each node/port in sequence, fires demos on button press, and once a
lesson is done it **unlocks** the nodes covered and drops the learner into an open **playground**
with exactly the palette they've earned so far. Patching is real Web Audio routing, so they're
building genuine intuition for signal flow and the modular nature of synthesis.

```
GUIDED LESSON (stepper highlights nodes + cables, demos on button)
        │  on complete → unlock nodes
        ▼
PLAYGROUND (free patching, only the nodes learned so far in the palette)
        │  next lesson
        ▼
GUIDED LESSON (adds new node types on top — progressive disclosure)  ...
```

---

## 2. Prior art to build on (use these, don't reinvent)

| Source | URL | What to take from it |
|---|---|---|
| **React Flow ↔ Web Audio tutorial** (powers `bleep.cafe`) | reactflow.dev/learn/tutorials/react-flow-and-the-web-audio-api | **Canonical reference.** End-to-end pattern for an interactive audio-graph playground: `@xyflow/react` for the UI, `zustand` for state, `nanoid` for ids, custom audio nodes, connecting WebAudio nodes from React Flow edges. Mirror its architecture. |
| **synflow** | github.com/k1ln/synflow | Production-grade node-graph audio workstation on `@xyflow/react` + React 19 + Web Audio. Closest reference to our target; study its node/port + patch model. |
| **plinth** | github.com/rsimmons/plinth | Modular-synth "block" model: typed input/output ports, save/load patches, hosts that enumerate ports. Good model for our **typed ports + serializable patches**. |
| **audioMotion-analyzer** | npm `audiomotion-analyzer` | Drop-in real-time spectrum analyzer: log frequency scale, configurable FFT size, dB sensitivity, no deps (<20kB). Candidate for the spectrum view. |
| **SynthEngineer: modular synth in the browser** | synthengineer.com/blog/web-audio-modular-js | Architecture rules we adopt: a **connection registry** (source→dest map) with **cycle validation before connecting**; use `audioContext.currentTime` as the clock (never `Date.now`/`setTimeout`); **look-ahead scheduling** (~50–100 ms). |
| **react-joyride** | react-joyride.com | The guided-tour engine. React-first, step array with `target`/`content`, focus trap, ARIA, callback event system — lets us coordinate steps with node highlighting and demo triggers. (driver.js is the lighter fallback.) |

> Net: the React Flow team literally wrote the tutorial for this exact thing. Start from that
> skeleton; layer our node catalog, viz panel, and guided flow on top.

---

## 3. Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER + TOOLBAR                                                           │
│ logo · lesson title · [▷ Run] [■ Stop] · node palette · save/load · tour ▶ │
├───────────────────────────────────────────────┬──────────────────────────┤
│                                                │  ANALYSIS COLUMN          │
│                                                │  ┌──────────────────────┐ │
│        REACT FLOW CANVAS (primary)             │  │ Oscilloscope          │ │
│        - audio nodes                           │  │ (waveform, time vs amp│ │
│        - cables (typed edges)                  │  └──────────────────────┘ │
│        - mini-map, controls, snap grid         │  ┌──────────────────────┐ │
│                                                │  │ FFT Spectrum          │ │
│                                                │  │ (Hz vs dBFS, log X)   │ │
│                                                │  └──────────────────────┘ │
│                                                │  ┌──────────────────────┐ │
│                                                │  │ Spectrogram           │ │
│                                                │  │ (time vs Hz, color=dB)│ │
│                                                │  └──────────────────────┘ │
└───────────────────────────────────────────────┴──────────────────────────┘
```

- **Header/toolbar (top, full width):** transport (Run/Stop), node palette/add menu (gated by
  unlocked nodes), save/load patch, and a "Start/Resume lesson" tour control. Surface **agent/engine
  state** here (red = working/audio-live, arctic blue = idle/settled) per the palette.
- **Canvas (left, dominant):** React Flow. Pan/zoom, snap-to-grid, minimap, selection. Cables are
  typed edges (see §5). This is where nearly all interaction happens.
- **Analysis column (right):** three stacked scopes that read from a tap on the currently selected
  node (or the master output). All three have **real, labeled axes** (see §6) — this is the
  "make invisible systems visible" payoff and is non-negotiable.

Responsive: below a breakpoint, the analysis column collapses into a bottom drawer / tabbed panel.

---

## 4. The two graphs (keep them in sync, keep them separate)

There are **two** graphs and conflating them is the classic bug:

1. **UI graph** — React Flow nodes/edges (positions, selection, params). Lives in a `zustand` store.
2. **Audio graph** — actual `AudioNode`s + their `.connect()` wiring in a single shared `AudioContext`.

A thin **AudioEngine** layer reconciles them:
- On edge add → validate (type match + no illegal cycle) → `source.connect(dest)` and register in a
  **connection registry**.
- On edge remove → `source.disconnect(dest)` and deregister.
- On node param change → schedule on `audioContext.currentTime` with smoothing
  (`setTargetAtTime` / `linearRampToValueAtTime`), never abrupt sets.
- One `AudioContext`, created/resumed on first user gesture (browser autoplay policy).

Borrow the tutorial's `zustand`-store-drives-WebAudio pattern; borrow synflow/plinth's typed-port
and serializable-patch model.

---

## 5. Custom audio nodes & cables

### Node anatomy
Each node is a React Flow custom node rendering:
- a **title bar** (node type, color-coded),
- **typed ports** (React Flow handles): inputs on the left, outputs on the right,
- inline **controls** (sliders/selectors) for its params,
- optional tiny inline readout (e.g. current freq).

### Port / signal types (typed handles)
Color- and shape-code handles by signal type; **reject mismatched connections** in
`isValidConnection`:
- `audio` — main signal path (osc → filter → output).
- `cv` / `mod` — modulation/control (LFO/envelope → a param, e.g. FM, filter cutoff).
- `trigger` / `gate` — note on/off, clock.

### Cables (edges)
- Custom **bezier/animated edges** styled like patch cables; color by signal type.
- Animate flow while audio is live (subtle dash motion) so the learner sees signal moving.
- A param target (e.g. an oscillator's frequency `AudioParam`) is a valid destination — that's how
  FM/modulation patching teaches itself.

### Node catalog (maps 1:1 to the Phase One RIDDIM arc)
| Node | Lesson | Ports | Key params |
|---|---|---|---|
| **Oscillator** | 01 | out: audio; in: freq(cv) | waveform, frequency, detune, gain |
| **Unison** (or osc multiplicity) | 02 | out: audio | voices, detune spread, stereo width |
| **Envelope (ADSR)** | 03 | out: cv; in: gate | A, D, S, R; target depth |
| **Wavetable osc** | 04 | out: audio; in: pos(cv), freq(cv) | table, morph position |
| **Filter** | 05 | in: audio, cutoff(cv); out: audio | type, cutoff, resonance |
| **Mixer / Layer** | 06 | in: audio[ ]; out: audio | per-input gain, pan |
| **LFO** | (modulation, intro w/ env) | out: cv | rate, shape, depth |
| **Output / Destination** | 01+ | in: audio | master gain |
| **Analyser tap** | always-on | in: audio; out: audio (passthrough) | feeds the right-column scopes |

Nodes are **gated**: only unlocked types appear in the palette (see §7). Adding a node beyond the
current lesson is blocked until earned.

---

## 6. Analysis column — proper axes (the differentiator)

All three read from an `AnalyserNode` tapping the selected node or master out. Build them as
reusable `lib/viz` components. Either hand-roll on `<canvas>` (full axis control) or use
`audiomotion-analyzer` for the spectrum and hand-roll the scope/spectrogram.

**1. Oscilloscope (waveform)**
- Source: `analyser.getByteTimeDomainData()`.
- **X = time** (samples → ms, label the window), **Y = amplitude** (−1…+1, centered zero line).
- Trigger/stabilize on zero-crossing so the wave doesn't slide.

**2. FFT Spectrum**
- Source: `analyser.getByteFrequencyData()`.
- **X = frequency, logarithmic**, labeled `20 Hz → 20 kHz` (and kHz tick labels).
  Bin → Hz: `freq = i * sampleRate / fftSize`.
- **Y = magnitude in dBFS**, labeled (e.g. `0 → −100 dBFS`).
  Byte → dBFS: `dBFS = minDecibels + (byte / 255) * (maxDecibels − minDecibels)`.
- Expose `fftSize`, `smoothingTimeConstant`, `min/maxDecibels` as dev/advanced controls.
- (Web Audio applies a Blackman window before the FFT — note this in docs for the curious.)

**3. Spectrogram**
- Stack successive `getByteFrequencyData()` frames as rows.
- **X = time** (scrolling), **Y = frequency (log)**, **color = magnitude (dB)** with a legend.

Axes must have gridlines, tick labels, and units. Hover tooltips (freq + dB at cursor) are a strong
plus for the educational goal.

---

## 7. Guided education flow (TurboTax-style)

A lesson = an ordered sequence of **steps** rendered as a stepper/wizard overlay, driven by
**react-joyride** (React-first control, focus trap, ARIA, callback events). Steps coordinate with
the canvas: highlight nodes/ports/cables, gate progression on the learner performing an action, and
fire **demos on button press**.

### Step types
- `explain` — tooltip on a highlighted target (node, port, cable, or scope), with copy + optional
  inline diagram.
- `demo` — a button that runs a scripted patch/param sweep so the learner *hears* the concept
  (e.g. "Press to hear detune widen"), with the scopes reacting live.
- `do` — the learner must perform an action to advance (e.g. "Connect the oscillator's output to the
  filter's input"); detected via the React Flow store, then auto-advance.
- `reflect` — short check / recap.

Pages/tabs: group steps into **pages** the learner tabs through; a progress indicator shows position
in the lesson. On the last page → **unlock** the lesson's nodes and switch into **playground mode**
(tour overlay dismissed, full palette-so-far available, scopes live).

### Highlighting on the canvas
react-joyride targets DOM by selector; give each custom node/port a stable `data-tour-id`
(e.g. `data-tour-id="node-oscillator"`, `data-tour-id="port-oscillator-out"`). For demos, the step
dispatches engine actions (load a patch, ramp a param) via the AudioEngine API.

### Progressive disclosure
Each lesson layers new node types onto the canvas without resetting layout — the prior patch stays,
new nodes/controls appear. The palette grows lesson by lesson; cognitive load stays low.

---

## 8. Contracts (extend the Zod schemas from `AGENTS.md`)

Add lesson/patch/step schemas so content (and any agent-generated lessons) is validated.

```ts
import { z } from "zod";

export const PortType = z.enum(["audio", "cv", "trigger"]);

export const PatchNode = z.object({
  id: z.string(),
  type: z.string(),                 // "oscillator" | "filter" | ...
  position: z.object({ x: z.number(), y: z.number() }),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])),
});

export const PatchEdge = z.object({
  id: z.string(),
  source: z.string(), sourceHandle: z.string(),
  target: z.string(), targetHandle: z.string(),
  signal: PortType,
});

export const Patch = z.object({              // a serializable graph (lesson preset or saved playground)
  nodes: z.array(PatchNode),
  edges: z.array(PatchEdge),
});

export const TourStep = z.object({
  id: z.string(),
  kind: z.enum(["explain", "demo", "do", "reflect"]),
  target: z.string().optional(),             // data-tour-id selector
  content: z.string(),
  demoPatch: Patch.optional(),               // for "demo": patch/automation to run
  requires: z.object({                       // for "do": completion condition
    edge: z.object({ from: z.string(), to: z.string() }).optional(),
    nodeAdded: z.string().optional(),
  }).optional(),
});

export const Lesson = z.object({
  slug: z.string(),                          // ties to METADATA_SCHEMA.md experiment
  title: z.string(),
  unlocksNodes: z.array(z.string()),         // node types granted on completion
  startingPatch: Patch.optional(),
  pages: z.array(z.object({ title: z.string(), steps: z.array(TourStep) })),
});
```

> Lessons reference the existing experiment `slug`/metadata; the knowledge graph still indexes them.

---

## 9. Aesthetic (carry over from `HANDOFF.md`)

Dark-brutalist / new-age-CLI: deep dark purple base, **hot red** for live/working states, **arctic
blue** for idle/settled. Apply to: cables (signal-type tints within that family), node title bars,
the "audio live" pulse on the transport, and tour highlight rings. Blocky, sharp, minimal; shadcn
base + Magic UI only for accent moments. Scope gridlines low-contrast; signal traces in the accent
hues.

---

## 10. Stack & dependencies

- **Next.js** (App Router) — existing.
- **@xyflow/react** (React Flow) — canvas, custom nodes, custom edges.
- **zustand** — UI-graph + engine state (matches the React Flow tutorial).
- **nanoid** — ids.
- **Web Audio API** (+ **Tone.js** where it speeds prototyping) — audio graph.
- **audiomotion-analyzer** — spectrum view (optional; scope/spectrogram hand-rolled on canvas).
- **react-joyride** — guided tours (driver.js as lighter fallback).
- **zod** — contracts (existing).
- **shadcn/ui** + **Magic UI** — components/accents (existing).
- **three** — 3D viz, still a **stretch goal**.

---

## 11. Build order

1. **Canvas skeleton** — Next.js page with React Flow + zustand store + single `AudioContext`
   (resume-on-gesture). Reproduce the React Flow tutorial baseline.
2. **AudioEngine reconciler** — edge add/remove → connect/disconnect; connection registry; cycle
   validation; param scheduling on `currentTime`.
3. **First two nodes + Output** — Oscillator → Output, with typed `audio` ports and a real cable.
4. **Analysis column** — oscilloscope + FFT spectrum with labeled axes (tap selected node); then
   spectrogram.
5. **Node catalog** — add Filter, Envelope, Wavetable, Unison, Mixer/LFO; typed `cv`/`trigger`
   ports; modulation patching into `AudioParam`s.
6. **Guided flow** — react-joyride stepper, `data-tour-id`s, demo/do step handling, page tabs,
   node-unlock + playground handoff.
7. **Persistence** — serialize/deserialize `Patch` (save/load, lesson presets).
8. **Polish** — palette, animated cables, agent/engine-state indicators, responsive collapse.
9. **Stretch** — Three.js 3D harmonic/layer views.

---

## 12. Open questions / assumptions made

Flagging where I made a call so you can correct before Cursor runs:
1. **Single canvas shell, lessons load into it** (not per-lesson separate routes). Assumed this
   because progressive disclosure + node unlocking wants one persistent canvas.
2. **Audio is fully live/functional** (real routing, real sound), not illustrative — your "feel how
   to wire it up" language implies this.
3. **Existing metadata/docs/knowledge-graph stays the content backbone**; lessons reference
   experiment `slug`s. Only the delivery surface changed.
4. **react-joyride over driver.js** for the guided flow, because we need tight coordination between
   tour steps and the React Flow store (detecting `do` actions, firing demos).
5. **Spectrum via audiomotion-analyzer, scope + spectrogram hand-rolled** for full axis control —
   open to all-hand-rolled if you'd rather have zero deps and uniform styling.
