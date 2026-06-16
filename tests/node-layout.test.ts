import { describe, expect, it } from "vitest";
import {
  getNodeDimensions,
  NODE_LAYOUT_METADATA,
  normalizeMeasuredLayout,
} from "@/lib/patch/node-layout";

describe("node layout metadata", () => {
  it("keeps metadata width even when measured width is smaller", () => {
    const meta = NODE_LAYOUT_METADATA.oscillator;
    const dims = getNodeDimensions("oscillator", { width: 180, height: 400 });
    expect(dims.width).toBe(meta.width);
    expect(dims.height).toBe(400);
  });

  it("normalizes measured layout to metadata width", () => {
    const normalized = normalizeMeasuredLayout("oscillator", {
      width: 150,
      height: 455,
    });
    expect(normalized.width).toBe(NODE_LAYOUT_METADATA.oscillator.width);
    expect(normalized.height).toBe(455);
  });
});
