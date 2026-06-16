import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRANSPORT_BPM,
  resolveLfoRateHz,
  syncedLfoHz,
} from "@/lib/patch/transport";

describe("transport sync", () => {
  it("computes 1/4 note rate from BPM", () => {
    expect(syncedLfoHz(140, "1/4")).toBeCloseTo(140 / 60, 4);
    expect(syncedLfoHz(140, "1/8")).toBeCloseTo((140 / 60) * 2, 4);
    expect(syncedLfoHz(140, "1/2")).toBeCloseTo((140 / 60) * 0.5, 4);
  });

  it("uses free rate when sync is free", () => {
    expect(resolveLfoRateHz({ sync: "free", rate: 3.5 }, 140)).toBe(3.5);
  });

  it("defaults transport BPM to riddim range", () => {
    expect(DEFAULT_TRANSPORT_BPM).toBe(140);
  });
});
