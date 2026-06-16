import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  reconnectEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodePositionChange,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import { AudioEngine } from "./audio-engine";
import type { PatchNodeData, NodeKind } from "./ports";
import { DEFAULT_UNLOCKED, parseHandle } from "./ports";
import type { Lesson, Patch } from "@/lib/schemas/patch";
import { lesson01Oscillator } from "./lessons/lesson-01-oscillator";
import { getNextLesson } from "./lessons/index";
import { presetToPatch } from "./presets/load";
import { getPatchPreset } from "./presets/index";
import type { RewireAnchor, RewireDraft, HandleHit } from "./edge-rewire";
import {
  buildRewireConnection,
  parseEdgeSignal,
} from "./edge-rewire";
import {
  cloneGraph,
  isUndoableEdgeChange,
  isUndoableNodeChange,
  MAX_HISTORY,
  type GraphSnapshot,
} from "./history";
import { layoutPatchGraph, suggestNodeSeed } from "./layout";
import { patchToFlow } from "./patch-flow";
import {
  applyCollisionPositions,
  hasAnyOverlap,
  toPositionedNodes,
  COLLISION_PADDING,
} from "./collision-layout";
import { animateRepulsion, hasMovableOverlap } from "./position-animation";
import { mergeMeasuredDimensions, normalizeMeasuredLayout, type NodeDimensionMap } from "./node-layout";
import {
  isScopeTappable,
  resolveDefaultScopeTapId,
} from "./scope-tap";
import {
  getSubProtectedSourceIds,
  isSubCvConnectionBlocked,
} from "./sub-protection";
import { DEFAULT_TRANSPORT_BPM } from "./transport";
import { DEFAULT_LFO_CURVE } from "./lfo-curve";
import {
  DEFAULT_CV_EDGE_DATA,
  normalizeModDepth,
} from "@/lib/schemas/patch-edge-data";

function edgeDataFromConnection(connection: Connection) {
  const signal = parseHandle(connection.sourceHandle)?.signal ?? "audio";
  if (signal === "cv") {
    return { signal, ...DEFAULT_CV_EDGE_DATA };
  }
  return { signal };
}

function migrateEdgeData(data: Record<string, unknown> | undefined) {
  if (!data) return data;
  if (data.signal !== "cv") return data;
  const depth =
    typeof data.modDepth === "number"
      ? normalizeModDepth(data.modDepth)
      : DEFAULT_CV_EDGE_DATA.modDepth;
  return {
    ...data,
    modDepth: depth,
    modOffset:
      typeof data.modOffset === "number"
        ? Math.max(-1, Math.min(1, data.modOffset))
        : DEFAULT_CV_EDGE_DATA.modOffset,
    modBipolar:
      typeof data.modBipolar === "boolean"
        ? data.modBipolar
        : DEFAULT_CV_EDGE_DATA.modBipolar,
  };
}

let engine: AudioEngine | null = null;

function getEngine(): AudioEngine {
  if (typeof window === "undefined") {
    throw new Error("AudioEngine only available in browser");
  }
  if (!engine) engine = new AudioEngine();
  return engine;
}

const initial = lesson01Oscillator.startingPatch
  ? patchToFlow(lesson01Oscillator.startingPatch)
  : { nodes: [], edges: [] };

export type PatchMode = "guided" | "playground";

let historyBatchSnapshot: GraphSnapshot | null = null;
let historyBatchQueued = false;

function flushHistoryBatch(
  set: (partial: Partial<PatchStore>) => void,
  get: () => PatchStore
) {
  historyBatchQueued = false;
  const snap = historyBatchSnapshot;
  historyBatchSnapshot = null;
  if (!snap || get().isTimeTraveling) return;

  const { past } = get();
  const last = past[past.length - 1];
  if (
    last &&
    JSON.stringify(last.nodes) === JSON.stringify(snap.nodes) &&
    JSON.stringify(last.edges) === JSON.stringify(snap.edges)
  ) {
    return;
  }
  set({
    past: [...past, snap].slice(-MAX_HISTORY),
    future: [],
  });
}

export type PatchStore = {
  nodes: Node<PatchNodeData>[];
  edges: Edge[];
  past: GraphSnapshot[];
  future: GraphSnapshot[];
  isTimeTraveling: boolean;
  isRunning: boolean;
  mode: PatchMode;
  activeLesson: Lesson;
  unlockedNodes: NodeKind[];
  tourStepIndex: number;
  lessonPanelOpen: boolean;
  showCompletionChoice: boolean;
  pianoOctaveOffset: number;
  selectedNodeId: string | null;
  scopeTapNodeId: string | null;
  transportBpm: number;
  enginePhase: "idle" | "working" | "settled";
  isLayoutAnimating: boolean;
  nodeMeasuredSizes: NodeDimensionMap;
  rewireDraft: RewireDraft | null;
  rewireCursor: { x: number; y: number } | null;
  registerNodeSize: (id: string, kind: NodeKind, height: number) => void;
  relayoutFromMeasurements: () => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodeDragStart: () => void;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: Edge, connection: Connection) => void;
  beginRewire: (
    edge: Edge,
    anchor: RewireAnchor,
    freeEnd: RewireDraft["freeEnd"],
    cursor: { x: number; y: number }
  ) => void;
  updateRewireCursor: (cursor: { x: number; y: number }) => void;
  completeRewire: (hit: HandleHit) => void;
  cancelRewire: () => void;
  isValidConnection: (connection: Connection | Edge) => boolean;
  addNode: (kind: NodeKind, position?: { x: number; y: number }) => void;
  updateNodeParams: (
    id: string,
    params: Record<string, number | string | boolean>
  ) => void;
  updateGeneratorNodesLive: (
    params: Record<string, number | string | boolean>
  ) => void;
  setPianoOctaveOffset: (offset: number) => void;
  setGeneratorKeyGate: (open: boolean) => void;
  run: () => Promise<void>;
  stop: () => void;
  loadLesson: (lesson: Lesson) => void;
  loadPreset: (presetId: string) => void;
  completeLesson: () => void;
  finishGuidedSteps: () => void;
  choosePlayground: () => void;
  chooseNextLesson: () => void;
  setLessonPanelOpen: (open: boolean) => void;
  setTourStep: (index: number) => void;
  advanceTour: () => void;
  dismissTour: () => void;
  setSelectedNode: (id: string | null) => void;
  setScopeTapNodeId: (id: string | null) => void;
  setTransportBpm: (bpm: number) => void;
  updateModDepth: (edgeId: string, depth: number) => void;
  updateModOffset: (edgeId: string, offset: number) => void;
  updateModBipolar: (edgeId: string, bipolar: boolean) => void;
  getLiveParamValue: (nodeId: string, handle: string) => number | undefined;
  subscribeModPreview: (listener: () => void) => () => void;
  recordResample: (seconds?: number) => Promise<string | null>;
  syncEngine: () => void;
  toPatch: () => Patch;
  getAnalyser: () => AnalyserNode | null;
};

export const usePatchStore = create<PatchStore>((set, get) => {
  let cancelLayoutAnimation: (() => void) | null = null;
  let relayoutTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelActiveLayoutAnimation = () => {
    cancelLayoutAnimation?.();
    cancelLayoutAnimation = null;
    if (get().isLayoutAnimating) {
      set({ isLayoutAnimating: false });
    }
  };

  const getLayoutDimensions = (): NodeDimensionMap => {
    const { nodes, nodeMeasuredSizes } = get();
    return mergeMeasuredDimensions(
      nodes.map((n) => ({ id: n.id, kind: n.data.kind })),
      nodeMeasuredSizes
    );
  };

  const runLayoutRepulsion = (
    movableIds: ReadonlySet<string>,
    syncIfIdle = true
  ) => {
    cancelLayoutAnimation?.();
    cancelLayoutAnimation = null;

    const dimensions = getLayoutDimensions();
    const positioned = toPositionedNodes(get().nodes);
    if (!hasMovableOverlap(positioned, movableIds, COLLISION_PADDING, dimensions)) {
      if (syncIfIdle) get().syncEngine();
      return;
    }

    set({ isLayoutAnimating: true });

    cancelLayoutAnimation = animateRepulsion(positioned, movableIds, {
      dimensions,
      onUpdate: (positions) => {
        set({
          nodes: applyCollisionPositions(get().nodes, positions),
        });
      },
      onComplete: (final) => {
        cancelLayoutAnimation = null;
        set({
          isLayoutAnimating: false,
          nodes: applyCollisionPositions(get().nodes, final),
        });
        get().syncEngine();
      },
    });
  };

  return {
  nodes: initial.nodes,
  edges: initial.edges,
  past: [],
  future: [],
  isTimeTraveling: false,
  isRunning: false,
  mode: "guided",
  activeLesson: lesson01Oscillator,
  unlockedNodes: [...DEFAULT_UNLOCKED, "analyser"],
  tourStepIndex: 0,
  lessonPanelOpen: true,
  showCompletionChoice: false,
  pianoOctaveOffset: 0,
  selectedNodeId: null,
  scopeTapNodeId: null,
  transportBpm: DEFAULT_TRANSPORT_BPM,
  enginePhase: "idle",
  isLayoutAnimating: false,
  nodeMeasuredSizes: new Map(),
  rewireDraft: null,
  rewireCursor: null,

  registerNodeSize: (id, kind, height) => {
    const parsed = normalizeMeasuredLayout(kind, { width: 0, height });
    const current = get().nodeMeasuredSizes.get(id);
    if (current && Math.abs(current.height - parsed.height) < 2) {
      return;
    }

    const nextSizes = new Map(get().nodeMeasuredSizes);
    nextSizes.set(id, parsed);
    set({
      nodeMeasuredSizes: nextSizes,
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, layout: parsed } } : n
      ),
    });
  },

  relayoutFromMeasurements: () => {
    if (relayoutTimer) clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(() => {
      relayoutTimer = null;
      const { nodes, edges, isLayoutAnimating, isTimeTraveling } = get();
      if (isTimeTraveling || isLayoutAnimating || nodes.length === 0) return;

      const layoutNodes = nodes.map((n) => ({ id: n.id, kind: n.data.kind }));
      const layoutEdges = edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }));
      const dimensions = getLayoutDimensions();
      const newPositions = layoutPatchGraph(
        layoutNodes,
        layoutEdges,
        get().nodeMeasuredSizes
      );

      const positioned = nodes.map((n) => ({
        id: n.id,
        kind: n.data.kind,
        x: newPositions.get(n.id)?.x ?? n.position.x,
        y: newPositions.get(n.id)?.y ?? n.position.y,
      }));

      const needsMove = nodes.some((n) => {
        const next = newPositions.get(n.id);
        return (
          next &&
          (Math.abs(next.x - n.position.x) > 1 ||
            Math.abs(next.y - n.position.y) > 1)
        );
      });

      const overlap = hasAnyOverlap(positioned, { dimensions });

      if (!needsMove && !overlap) return;

      set({ nodes: applyCollisionPositions(nodes, newPositions) });

      if (overlap) {
        runLayoutRepulsion(new Set(nodes.map((n) => n.id)), false);
      } else {
        get().syncEngine();
      }
    }, 24);
  },

  pushHistory: () => {
    if (get().isTimeTraveling) return;

    if (!historyBatchSnapshot) {
      historyBatchSnapshot = cloneGraph(get().nodes, get().edges);
    }

    if (!historyBatchQueued) {
      historyBatchQueued = true;
      queueMicrotask(() => flushHistoryBatch(set, get));
    }
  },

  undo: () => {
    cancelActiveLayoutAnimation();
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const current = cloneGraph(nodes, edges);

    set({
      isTimeTraveling: true,
      past: past.slice(0, -1),
      future: [current, ...future].slice(0, MAX_HISTORY),
      nodes: previous.nodes,
      edges: previous.edges,
    });
    get().syncEngine();
    set({ isTimeTraveling: false });
  },

  redo: () => {
    cancelActiveLayoutAnimation();
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;

    const next = future[0];
    const current = cloneGraph(nodes, edges);

    set({
      isTimeTraveling: true,
      future: future.slice(1),
      past: [...past, current].slice(-MAX_HISTORY),
      nodes: next.nodes,
      edges: next.edges,
    });
    get().syncEngine();
    set({ isTimeTraveling: false });
  },

  clearHistory: () => set({ past: [], future: [] }),

  onNodeDragStart: () => {
    get().pushHistory();
  },

  onNodesChange: (changes) => {
    if (isUndoableNodeChange(changes)) {
      get().pushHistory();
    }

    const dragEndIds = changes
      .filter(
        (c): c is NodePositionChange =>
          c.type === "position" && c.dragging === false
      )
      .map((c) => c.id);

    let nextNodes = applyNodeChanges(
      changes,
      get().nodes
    ) as Node<PatchNodeData>[];

    if (dragEndIds.length > 0) {
      set({ nodes: nextNodes });
      runLayoutRepulsion(new Set(dragEndIds), false);
      return;
    }

    set({ nodes: nextNodes });
    get().syncEngine();
  },

  onEdgesChange: (changes) => {
    if (isUndoableEdgeChange(changes)) {
      get().pushHistory();
    }
    set({ edges: applyEdgeChanges(changes, get().edges) });
    get().syncEngine();
  },

  onConnect: (connection) => {
    if (!get().isValidConnection(connection)) return;
    get().pushHistory();
    set({
      edges: addEdge(
        {
          ...connection,
          id: nanoid(),
          type: "patchCable",
          data: edgeDataFromConnection(connection),
        },
        get().edges
      ),
    });
    get().syncEngine();
  },

  onReconnect: (oldEdge, connection) => {
    if (!get().isValidConnection(connection)) return;
    get().pushHistory();
    set({
      edges: reconnectEdge(oldEdge, connection, get().edges),
    });
    get().syncEngine();
  },

  beginRewire: (edge, anchor, freeEnd, cursor) => {
    if (!get().edges.some((e) => e.id === edge.id)) return;
    get().pushHistory();
    set({
      edges: get().edges.filter((e) => e.id !== edge.id),
      rewireDraft: {
        ...anchor,
        freeEnd,
        signal: parseEdgeSignal(edge),
      },
      rewireCursor: cursor,
    });
    get().syncEngine();
  },

  updateRewireCursor: (cursor) => {
    if (!get().rewireDraft) return;
    set({ rewireCursor: cursor });
  },

  completeRewire: (hit) => {
    const draft = get().rewireDraft;
    if (!draft) return;

    if (
      hit.nodeId === draft.nodeId &&
      (hit.handleId ?? "") === (draft.handleId ?? "")
    ) {
      set({ rewireDraft: null, rewireCursor: null });
      return;
    }

    const connection = buildRewireConnection(draft, hit);
    if (!connection || !get().isValidConnection(connection)) {
      set({ rewireDraft: null, rewireCursor: null });
      return;
    }

    set({
      edges: addEdge(
        {
          ...connection,
          id: nanoid(),
          type: "patchCable",
          data: { signal: draft.signal },
        },
        get().edges
      ),
      rewireDraft: null,
      rewireCursor: null,
    });
    get().syncEngine();
  },

  cancelRewire: () => {
    if (!get().rewireDraft) return;
    set({ rewireDraft: null, rewireCursor: null });
  },

  isValidConnection: (connection) => {
    const c: Connection = {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? null,
      targetHandle: connection.targetHandle ?? null,
    };
    if (!getEngine().isValidConnection(c)) return false;
    const protectedIds = getSubProtectedSourceIds(get().nodes, get().edges);
    if (
      c.target &&
      isSubCvConnectionBlocked(c.target, c.targetHandle, protectedIds)
    ) {
      return false;
    }
    return true;
  },

  addNode: (kind, position) => {
    if (!get().unlockedNodes.includes(kind)) return;
    get().pushHistory();
    const id = `${kind}-${nanoid(6)}`;
    const defaults: Record<NodeKind, Record<string, number | string | boolean>> = {
      oscillator: { waveform: "sine", frequency: 261.63, gain: 1, glideMs: 35 },
      output: { gain: 0.8 },
      analyser: {},
      filter: { cutoff: 1200, resonance: 1 },
      envelope: {
        attack: 0.02,
        decay: 0.12,
        sustain: 0.65,
        release: 0.25,
        gain: 1,
        cvDepth: 400,
        cvSign: 1,
      },
      wavetable: {
        waveformA: "sine",
        waveformB: "sawtooth",
        frequency: 110,
        position: 0,
        gain: 0.5,
        glideMs: 35,
      },
      detune: { voices: 3, detune: 15, spread: 0.8, gain: 1 },
      unison: { voices: 3, detune: 15, spread: 0.8, gain: 1 },
      mixer: { gainA: 0.55, gainB: 0.45, gain: 0.8 },
      lfo: {
        rate: 2,
        depth: 350,
        shape: "sine",
        sync: "free",
        rateRatio: "1",
        curvePoints: DEFAULT_LFO_CURVE,
        keyTrack: false,
        holdSteps: 8,
      },
      fm: {
        carrierWave: "sine",
        modWave: "sawtooth",
        frequency: 110,
        ratio: 1,
        index: 400,
        gain: 0.5,
        glideMs: 35,
      },
      distortion: { type: "hard", drive: 5, mix: 0.9, gain: 0.7 },
      layerStack: {
        subGain: 0.75,
        bodyGain: 0.55,
        topGain: 0.3,
        subLpf: 200,
        bodyHpf: 80,
        bodyLpf: 6000,
        topHpf: 2000,
        gain: 0.8,
      },
      formant: {
        vowel: "a",
        formantShift: 0.35,
        q: 9,
        gain: 0.65,
      },
      noise: {
        noiseType: "white",
        cutoff: 3200,
        resonance: 2.5,
        gain: 0.35,
      },
      multiband: {
        amount: 0.65,
        threshold: -24,
        ratio: 8,
        lowCross: 250,
        highCross: 2500,
        gain: 0.85,
      },
      modFx: {
        type: "phaser",
        rate: 0.4,
        depth: 0.7,
        mix: 0.55,
        feedback: 0.45,
        gain: 0.8,
      },
      filterBank: {
        mode: "serial",
        f1Cutoff: 900,
        f2Cutoff: 3200,
        f1Res: 4,
        f2Res: 2,
        gain: 0.8,
      },
      macro: { value: 0.5 },
      sampler: { gain: 0.85, bufferId: "", loop: true },
    };

    const layoutNodes = get().nodes.map((n) => ({
      id: n.id,
      kind: n.data.kind,
    }));
    const layoutEdges = get().edges.map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    }));
    const positionMap = new Map(
      get().nodes.map((n) => [n.id, n.position] as const)
    );
    const nodePosition =
      position ??
      suggestNodeSeed(
        kind,
        layoutNodes,
        layoutEdges,
        id,
        positionMap,
        get().nodeMeasuredSizes
      );

    set({
      nodes: [
        ...get().nodes,
        {
          id,
          type: kind,
          position: nodePosition,
          data: {
            label: kind.charAt(0).toUpperCase() + kind.slice(1),
            kind,
            params: defaults[kind] ?? {},
          },
        },
      ],
    });
    runLayoutRepulsion(new Set([id]));
  },

  updateNodeParams: (id, params) => {
    get().pushHistory();
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, params: { ...n.data.params, ...params } } }
          : n
      ),
    });
    get().syncEngine();
  },

  updateGeneratorNodesLive: (params) => {
    const nodes = get().nodes;
    const liveKinds = new Set<NodeKind>(["oscillator", "fm", "wavetable"]);
    const next = nodes.map((n) =>
      liveKinds.has(n.data.kind)
        ? { ...n, data: { ...n.data, params: { ...n.data.params, ...params } } }
        : n
    );
    if (next.every((n, i) => n === nodes[i])) return;
    set({ nodes: next });
    if (typeof params.frequency === "number") {
      getEngine().setActiveNoteHz(params.frequency);
    }
    get().syncEngine();
  },

  setPianoOctaveOffset: (offset) => set({ pianoOctaveOffset: offset }),

  setGeneratorKeyGate: (open) => getEngine().setGeneratorKeyGate(open),

  run: async () => {
    set({ enginePhase: "working" });
    const eng = getEngine();
    await eng.resume();
    eng.syncUiGraph(get().nodes, get().edges);
    eng.start();
    set({ isRunning: true, enginePhase: "settled" });
  },

  stop: () => {
    getEngine().stop();
    set({ isRunning: false, enginePhase: "idle" });
  },

  loadLesson: (lesson) => {
    cancelActiveLayoutAnimation();
    if (relayoutTimer) {
      clearTimeout(relayoutTimer);
      relayoutTimer = null;
    }
    const flow = lesson.startingPatch
      ? patchToFlow(lesson.startingPatch)
      : { nodes: [], edges: [] };
    set({
      activeLesson: lesson,
      nodes: flow.nodes,
      edges: flow.edges,
      nodeMeasuredSizes: new Map(),
      mode: "guided",
      tourStepIndex: 0,
      lessonPanelOpen: true,
      showCompletionChoice: false,
      past: [],
      future: [],
      unlockedNodes: [
        ...new Set([
          ...get().unlockedNodes,
          ...DEFAULT_UNLOCKED,
          "analyser",
          ...(lesson.unlocksNodes as NodeKind[]),
        ]),
      ] as NodeKind[],
    });
    get().syncEngine();
  },

  loadPreset: (presetId) => {
    const preset = getPatchPreset(presetId);
    const patch = presetToPatch(presetId);
    if (!preset || !patch) return;

    cancelActiveLayoutAnimation();
    if (relayoutTimer) {
      clearTimeout(relayoutTimer);
      relayoutTimer = null;
    }

    get().pushHistory();
    const flow = patchToFlow(patch);
    set({
      nodes: flow.nodes,
      edges: flow.edges,
      nodeMeasuredSizes: new Map(),
      scopeTapNodeId: null,
      mode: "playground",
      showCompletionChoice: false,
      lessonPanelOpen: false,
      tourStepIndex: 0,
      unlockedNodes: [
        ...new Set([
          ...get().unlockedNodes,
          ...DEFAULT_UNLOCKED,
          "analyser",
          ...(preset.requiredNodes as NodeKind[]),
        ]),
      ] as NodeKind[],
    });
    get().syncEngine();
  },

  completeLesson: () => {
    const lesson = get().activeLesson;
    const stepCount = lesson.pages.flatMap((p) => p.steps).length;
    set({
      mode: "playground",
      tourStepIndex: stepCount,
      unlockedNodes: [
        ...new Set([
          ...get().unlockedNodes,
          ...(lesson.unlocksNodes as NodeKind[]),
        ]),
      ] as NodeKind[],
    });
  },

  finishGuidedSteps: () => {
    const lesson = get().activeLesson;
    const steps = lesson.pages.flatMap((p) => p.steps);
    set({
      showCompletionChoice: true,
      tourStepIndex: steps.length - 1,
      unlockedNodes: [
        ...new Set([
          ...get().unlockedNodes,
          ...(lesson.unlocksNodes as NodeKind[]),
        ]),
      ] as NodeKind[],
    });
  },

  choosePlayground: () => {
    get().completeLesson();
    set({
      showCompletionChoice: false,
      lessonPanelOpen: false,
    });
  },

  chooseNextLesson: () => {
    const next = getNextLesson(get().activeLesson.slug);
    if (!next) {
      get().choosePlayground();
      return;
    }
    get().completeLesson();
    get().loadLesson(next);
  },

  setLessonPanelOpen: (open) => set({ lessonPanelOpen: open }),

  dismissTour: () => {
    get().completeLesson();
    set({
      showCompletionChoice: false,
      lessonPanelOpen: false,
    });
  },

  setTourStep: (index) => set({ tourStepIndex: index }),

  advanceTour: () => {
    const steps = get().activeLesson.pages.flatMap((p) => p.steps);
    const next = get().tourStepIndex + 1;
    if (next >= steps.length) {
      get().finishGuidedSteps();
    } else {
      set({ tourStepIndex: next });
    }
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  setScopeTapNodeId: (id) => {
    const nodes = get().nodes;
    if (id && !nodes.some((n) => n.id === id && isScopeTappable(n.data.kind))) {
      return;
    }
    set({ scopeTapNodeId: id });
    getEngine().setScopeTap(id);
  },

  setTransportBpm: (bpm) => {
    const clamped = Math.max(60, Math.min(200, Math.round(bpm)));
    set({ transportBpm: clamped });
    getEngine().setTransportBpm(clamped);
  },

  updateModDepth: (edgeId, depth) => {
    const clamped = Math.max(-1, Math.min(1, depth));
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, modDepth: clamped } }
          : e
      ),
    });
    get().syncEngine();
  },

  updateModOffset: (edgeId, offset) => {
    const clamped = Math.max(-1, Math.min(1, offset));
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, modOffset: clamped } }
          : e
      ),
    });
    get().syncEngine();
  },

  updateModBipolar: (edgeId, bipolar) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, modBipolar: bipolar } } : e
      ),
    });
    get().syncEngine();
  },

  getLiveParamValue: (nodeId, handle) =>
    getEngine().modPreview.getValue(nodeId, handle),

  subscribeModPreview: (listener) => getEngine().modPreview.subscribe(listener),

  recordResample: async (seconds = 2) => {
    const eng = getEngine();
    const buffer = await eng.recordFromScopeTap(seconds);
    if (!buffer) return null;
    const bufferId = `resample-${nanoid(8)}`;
    eng.registerResampleBuffer(bufferId, buffer);
    const before = get().nodes.length;
    get().addNode("sampler", { x: 420, y: 280 });
    const added = get().nodes[get().nodes.length - 1];
    if (added && get().nodes.length > before) {
      get().updateNodeParams(added.id, { bufferId, gain: 0.85 });
    }
    return bufferId;
  },

  syncEngine: () => {
    const eng = getEngine();
    eng.setTransportBpm(get().transportBpm);
    const shouldRun = get().isRunning;
    const { nodes, edges, scopeTapNodeId } = get();

    let tapId = scopeTapNodeId;
    if (tapId && !nodes.some((n) => n.id === tapId)) {
      tapId = resolveDefaultScopeTapId(nodes);
      set({ scopeTapNodeId: tapId });
    }

    eng.syncUiGraph(nodes, edges);
    eng.setScopeTap(tapId);
    if (shouldRun && !eng.isRunning) {
      eng.start();
      set({ isRunning: true, enginePhase: "settled" });
    }
  },

  toPatch: () => ({
    nodes: get().nodes.map((n) => ({
      id: n.id,
      type: n.data.kind,
      position: n.position,
      params: n.data.params,
      layout: n.data.layout ?? get().nodeMeasuredSizes.get(n.id),
    })),
    edges: get().edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? "audio-out",
      target: e.target,
      targetHandle: e.targetHandle ?? "audio-in",
      signal: (e.data?.signal as "audio" | "cv" | "trigger") ?? "audio",
    })),
  }),

  getAnalyser: () => getEngine().analyser,
  };
});
