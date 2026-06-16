import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { riddimDropMinimal } from "@/lib/song/templates";
import {
  SongScheduler,
  scheduleBarTimeline,
  beatToSeconds,
  flattenSongEvents,
} from "@/lib/song";
import type { PatchSongBridge } from "@/lib/song/trigger-patch-note";

function mockBridge(): PatchSongBridge & {
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  return {
    calls,
    loadPreset: (id) => calls.push({ method: "loadPreset", args: [id] }),
    setTransportBpm: (bpm) =>
      calls.push({ method: "setTransportBpm", args: [bpm] }),
    setGeneratorKeyGate: (open) =>
      calls.push({ method: "setGeneratorKeyGate", args: [open] }),
    updateGeneratorNodesLive: (p) =>
      calls.push({ method: "updateGeneratorNodesLive", args: [p] }),
    run: async () => calls.push({ method: "run", args: [] }),
    stop: () => calls.push({ method: "stop", args: [] }),
  };
}

describe("song scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes beat to seconds at 140 BPM", () => {
    expect(beatToSeconds(1, 140)).toBeCloseTo(60 / 140, 5);
    expect(beatToSeconds(4, 140)).toBeCloseTo(4 * (60 / 140), 5);
  });

  it("golden timeline for bar 0 of minimal drop", () => {
    const bar0 = scheduleBarTimeline(riddimDropMinimal, 0);
    expect(bar0.map((e) => e.kind)).toEqual(["preset", "note", "note"]);
    expect(bar0[0]?.beat).toBe(0);
    expect(bar0[1]?.beat).toBe(0);
    expect(bar0[2]?.beat).toBe(2);
  });

  it("flattens section-local beats to absolute timeline", () => {
    const events = flattenSongEvents(riddimDropMinimal);
    const maxBeat = Math.max(...events.map((e) => e.absoluteBeat));
    expect(maxBeat).toBeLessThan(16);
    expect(events.some((e) => e.absoluteBeat >= 4)).toBe(true);
  });

  it("fires transport + note events via bridge", async () => {
    const bridge = mockBridge();
    const scheduler = new SongScheduler({ bridge });

    const playPromise = scheduler.play(riddimDropMinimal);
    await vi.runAllTimersAsync();
    await playPromise;

    expect(bridge.calls.some((c) => c.method === "setTransportBpm")).toBe(true);
    expect(bridge.calls.some((c) => c.method === "run")).toBe(true);
    expect(
      bridge.calls.filter((c) => c.method === "updateGeneratorNodesLive").length
    ).toBeGreaterThan(0);
  });
});
