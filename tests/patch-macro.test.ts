import { describe, expect, it } from "vitest";
import { createRuntimeNode } from "@/lib/patch/runtime-nodes";

describe("macro runtime", () => {
  it("exposes cv-out gain node", () => {
    if (typeof AudioContext === "undefined") return;
    const ctx = new AudioContext();
    const macro = createRuntimeNode(ctx, "macro", "macro-1", { value: 0.75 });
    expect(macro).not.toBeNull();
    expect(macro!.getOutput("cv-out")).toBeTruthy();
    macro!.dispose();
    ctx.close();
  });
});
