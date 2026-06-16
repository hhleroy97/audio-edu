import { describe, expect, it } from "vitest";
import { ModPreviewBus } from "@/lib/patch/mod-preview";

describe("mod preview bus", () => {
  it("returns registered AudioParam value", () => {
    const bus = new ModPreviewBus();
    const param = { value: 420 } as AudioParam;
    bus.register("filt-1", "cv-cutoff", param);
    expect(bus.getValue("filt-1", "cv-cutoff")).toBe(420);
    bus.clear();
    expect(bus.getValue("filt-1", "cv-cutoff")).toBeUndefined();
  });
});
