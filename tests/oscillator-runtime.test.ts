import { describe, expect, it } from "vitest";
import { createOscillatorRuntime } from "@/lib/patch/runtime-nodes";

type TrackedNode = {
  kind: "gain" | "osc";
  connections: TrackedNode[];
  connect: (node: TrackedNode) => TrackedNode;
  disconnect: () => void;
  gain?: { value: number; setTargetAtTime: (v: number) => void };
  type?: OscillatorType;
  frequency?: { setTargetAtTime: () => void };
  detune?: { setTargetAtTime: () => void };
  start?: () => void;
  stop?: () => void;
};

function createTrackedContext() {
  const nodes: TrackedNode[] = [];

  const track = (node: TrackedNode) => {
    nodes.push(node);
    return node;
  };

  const ctx = {
    currentTime: 0,
    destination: track({
      kind: "gain",
      connections: [],
      connect(node) {
        this.connections.push(node);
        return node;
      },
      disconnect() {
        this.connections = [];
      },
      gain: { value: 1, setTargetAtTime() {} },
    }),
    createGain() {
      return track({
        kind: "gain",
        connections: [],
        connect(node) {
          this.connections.push(node);
          return node;
        },
        disconnect() {
          this.connections = [];
        },
        gain: { value: 0, setTargetAtTime(v: number) { this.gain!.value = v; } },
      });
    },
    createOscillator() {
      return track({
        kind: "osc",
        connections: [],
        connect(node) {
          this.connections.push(node);
          return node;
        },
        disconnect() {
          this.connections = [];
        },
        type: "sine" as OscillatorType,
        frequency: { setTargetAtTime() {} },
        detune: { setTargetAtTime() {} },
        start() {},
        stop() {},
      });
    },
  } as unknown as AudioContext;

  return { ctx, nodes };
}

describe("oscillator runtime", () => {
  it("wires osc → key gate → level for audio-out", () => {
    const { ctx, nodes } = createTrackedContext();
    const runtime = createOscillatorRuntime(ctx, "osc-1", {
      waveform: "sine",
      frequency: 440,
      gain: 0.8,
    });

    const level = runtime.getOutput("audio-out") as TrackedNode;
    const osc = nodes.find((n) => n.kind === "osc");
    const gains = nodes.filter((n) => n.kind === "gain");

    expect(osc).toBeDefined();
    expect(level).toBeDefined();
    expect(gains.length).toBeGreaterThanOrEqual(2);

    const keyGate = osc!.connections[0];
    expect(keyGate).toBeDefined();
    expect(keyGate!.connections[0]).toBe(level);
  });
});
