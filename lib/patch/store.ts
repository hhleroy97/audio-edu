import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import { AudioEngine } from "./audio-engine";
import type { PatchNodeData, NodeKind } from "./ports";
import { DEFAULT_UNLOCKED } from "./ports";
import type { Lesson, Patch } from "@/lib/schemas/patch";
import { lesson01Oscillator } from "./lessons/lesson-01-oscillator";

let engine: AudioEngine | null = null;

function getEngine(): AudioEngine {
  if (typeof window === "undefined") {
    throw new Error("AudioEngine only available in browser");
  }
  if (!engine) engine = new AudioEngine();
  return engine;
}

function patchToFlow(patch: Patch): { nodes: Node<PatchNodeData>[]; edges: Edge[] } {
  return {
    nodes: patch.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        label: n.type.charAt(0).toUpperCase() + n.type.slice(1),
        kind: n.type as NodeKind,
        params: n.params,
      },
    })),
    edges: patch.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: "patchCable",
      data: { signal: e.signal },
    })),
  };
}

const initial = lesson01Oscillator.startingPatch
  ? patchToFlow(lesson01Oscillator.startingPatch)
  : { nodes: [], edges: [] };

export type PatchMode = "guided" | "playground";

export type PatchStore = {
  nodes: Node<PatchNodeData>[];
  edges: Edge[];
  isRunning: boolean;
  mode: PatchMode;
  activeLesson: Lesson;
  unlockedNodes: NodeKind[];
  tourStepIndex: number;
  selectedNodeId: string | null;
  enginePhase: "idle" | "working" | "settled";
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  isValidConnection: (connection: Connection | Edge) => boolean;
  addNode: (kind: NodeKind, position?: { x: number; y: number }) => void;
  updateNodeParams: (
    id: string,
    params: Record<string, number | string | boolean>
  ) => void;
  run: () => Promise<void>;
  stop: () => void;
  loadLesson: (lesson: Lesson) => void;
  completeLesson: () => void;
  setTourStep: (index: number) => void;
  advanceTour: () => void;
  dismissTour: () => void;
  setSelectedNode: (id: string | null) => void;
  syncEngine: () => void;
  toPatch: () => Patch;
  getAnalyser: () => AnalyserNode | null;
};

export const usePatchStore = create<PatchStore>((set, get) => ({
  nodes: initial.nodes,
  edges: initial.edges,
  isRunning: false,
  mode: "guided",
  activeLesson: lesson01Oscillator,
  unlockedNodes: [...DEFAULT_UNLOCKED, "analyser"],
  tourStepIndex: 0,
  selectedNodeId: null,
  enginePhase: "idle",

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<PatchNodeData>[],
    });
    get().syncEngine();
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    get().syncEngine();
  },

  onConnect: (connection) => {
    if (!get().isValidConnection(connection)) return;
    set({
      edges: addEdge(
        { ...connection, id: nanoid(), type: "patchCable" },
        get().edges
      ),
    });
    get().syncEngine();
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

  addNode: (kind, position = { x: 200, y: 200 }) => {
    if (!get().unlockedNodes.includes(kind)) return;
    const id = `${kind}-${nanoid(6)}`;
    const defaults: Record<NodeKind, Record<string, number | string | boolean>> = {
      oscillator: { waveform: "sine", frequency: 220, gain: 0.5 },
      output: { gain: 0.8 },
      analyser: {},
      filter: { cutoff: 1200, resonance: 1 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
      wavetable: { position: 0, frequency: 220, gain: 0.5 },
      unison: { voices: 3, detune: 15, spread: 0.5 },
      mixer: { gain: 0.8 },
      lfo: { rate: 2, depth: 1 },
    };
    set({
      nodes: [
        ...get().nodes,
        {
          id,
          type: kind,
          position,
          data: {
            label: kind.charAt(0).toUpperCase() + kind.slice(1),
            kind,
            params: defaults[kind] ?? {},
          },
        },
      ],
    });
    get().syncEngine();
  },

  updateNodeParams: (id, params) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, params: { ...n.data.params, ...params } } }
          : n
      ),
    });
    get().syncEngine();
  },

  run: async () => {
    set({ enginePhase: "working" });
    const eng = getEngine();
    await eng.resume();
    get().syncEngine();
    eng.start();
    set({ isRunning: true, enginePhase: "settled" });
  },

  stop: () => {
    getEngine().stop();
    set({ isRunning: false, enginePhase: "idle" });
  },

  loadLesson: (lesson) => {
    const flow = lesson.startingPatch
      ? patchToFlow(lesson.startingPatch)
      : { nodes: [], edges: [] };
    set({
      activeLesson: lesson,
      nodes: flow.nodes,
      edges: flow.edges,
      mode: "guided",
      tourStepIndex: 0,
      unlockedNodes: [
        ...DEFAULT_UNLOCKED,
        ...(lesson.unlocksNodes as NodeKind[]),
      ],
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
      ],
    });
  },

  dismissTour: () => {
    get().completeLesson();
  },

  setTourStep: (index) => set({ tourStepIndex: index }),

  advanceTour: () => {
    const steps = get().activeLesson.pages.flatMap((p) => p.steps);
    const next = get().tourStepIndex + 1;
    if (next >= steps.length) {
      get().completeLesson();
    } else {
      set({ tourStepIndex: next });
    }
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  syncEngine: () => {
    const eng = getEngine();
    eng.syncUiGraph(get().nodes, get().edges);
  },

  toPatch: () => ({
    nodes: get().nodes.map((n) => ({
      id: n.id,
      type: n.data.kind,
      position: n.position,
      params: n.data.params,
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
}));
