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
import { DEFAULT_UNLOCKED } from "./ports";
import type { Lesson, Patch } from "@/lib/schemas/patch";
import { lesson01Oscillator } from "./lessons/lesson-01-oscillator";
import { getNextLesson } from "./lessons/index";
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
import { applyLayoutToFlowNodes, layoutPatchGraph, suggestNodeSeed } from "./layout";
import {
  applyCollisionPositions,
  hasAnyOverlap,
  toPositionedNodes,
  COLLISION_PADDING,
} from "./collision-layout";
import { animateRepulsion, hasMovableOverlap } from "./position-animation";
import { mergeMeasuredDimensions, normalizeMeasuredLayout, type NodeDimensionMap } from "./node-layout";

let engine: AudioEngine | null = null;

function getEngine(): AudioEngine {
  if (typeof window === "undefined") {
    throw new Error("AudioEngine only available in browser");
  }
  if (!engine) engine = new AudioEngine();
  return engine;
}

function patchToFlow(patch: Patch): { nodes: Node<PatchNodeData>[]; edges: Edge[] } {
  const edges = patch.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: "patchCable" as const,
    data: { signal: e.signal },
  }));

  const nodes = patch.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      label: n.type.charAt(0).toUpperCase() + n.type.slice(1),
      kind: n.type as NodeKind,
      params: n.params,
      layout: n.layout,
    },
  }));

  return {
    nodes: applyLayoutToFlowNodes(nodes, edges),
    edges,
  };
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
  completeLesson: () => void;
  finishGuidedSteps: () => void;
  choosePlayground: () => void;
  chooseNextLesson: () => void;
  setLessonPanelOpen: (open: boolean) => void;
  setTourStep: (index: number) => void;
  advanceTour: () => void;
  dismissTour: () => void;
  setSelectedNode: (id: string | null) => void;
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
        { ...connection, id: nanoid(), type: "patchCable" },
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
    return getEngine().isValidConnection(c);
  },

  addNode: (kind, position) => {
    if (!get().unlockedNodes.includes(kind)) return;
    get().pushHistory();
    const id = `${kind}-${nanoid(6)}`;
    const defaults: Record<NodeKind, Record<string, number | string | boolean>> = {
      oscillator: { waveform: "sine", frequency: 261.63, gain: 1 },
      output: { gain: 0.8 },
      analyser: {},
      filter: { cutoff: 1200, resonance: 1 },
      envelope: {
        attack: 0.02,
        decay: 0.12,
        sustain: 0.65,
        release: 0.25,
        gain: 1,
      },
      wavetable: { position: 0, frequency: 220, gain: 0.5 },
      detune: { voices: 3, detune: 15, spread: 0.8, gain: 1 },
      unison: { voices: 3, detune: 15, spread: 0.8, gain: 1 },
      mixer: { gain: 0.8 },
      lfo: { rate: 2, depth: 1 },
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
    const next = nodes.map((n) =>
      n.data.kind === "oscillator"
        ? { ...n, data: { ...n.data, params: { ...n.data.params, ...params } } }
        : n
    );
    if (next.every((n, i) => n === nodes[i])) return;
    set({ nodes: next });
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

  syncEngine: () => {
    const eng = getEngine();
    const shouldRun = get().isRunning;
    eng.syncUiGraph(get().nodes, get().edges);
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
