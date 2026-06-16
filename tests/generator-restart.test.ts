import { describe, expect, it } from "vitest";
import { createRuntimeNode } from "@/lib/patch/runtime-nodes";

type OneShotOsc = {
  start: () => void;
  stop: () => void;
  disconnect: () => void;
  frequency: { value: number; setTargetAtTime: (v: number) => void };
  type: string;
  connect: () => OneShotOsc;
};

function createOneShotOsc(): OneShotOsc {
  let hasStarted = false;
  let hasStopped = false;
  const osc: OneShotOsc = {
    type: "sine",
    frequency: {
      value: 110,
      setTargetAtTime(v: number) {
        this.value = v;
      },
    },
    connect() {
      return osc;
    },
    disconnect() {},
    start() {
      if (hasStarted && hasStopped) {
        throw new DOMException(
          "Failed to execute 'start' on 'AudioScheduledSourceNode': cannot call start more than once."
        );
      }
      hasStarted = true;
    },
    stop() {
      hasStopped = true;
    },
  };
  return osc;
}

function createMockContext() {
  return {
    currentTime: 0,
    createGain: () => ({
      gain: { value: 1, setTargetAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
    }),
    createOscillator: createOneShotOsc,
  } as unknown as AudioContext;
}

describe("generator restart after stop", () => {
  it("FM runtime survives start → stop → start (song mode cycle)", () => {
    const ctx = createMockContext();
    const fm = createRuntimeNode(ctx, "fm", "fm-1", {
      frequency: 110,
      ratio: 2,
      index: 300,
      gain: 0.5,
    });
    expect(fm).not.toBeNull();

    fm!.start(0);
    fm!.stop(1);
    expect(() => fm!.start(1.1)).not.toThrow();

    fm!.dispose();
  });

  it("LFO runtime survives start → stop → start", () => {
    const ctx = createMockContext();
    const lfo = createRuntimeNode(ctx, "lfo", "lfo-1", {
      rate: 2,
      depth: 100,
      shape: "sine",
    });
    expect(lfo).not.toBeNull();

    lfo!.start(0);
    lfo!.stop(1);
    expect(() => lfo!.start(1.1)).not.toThrow();

    lfo!.dispose();
  });
});
