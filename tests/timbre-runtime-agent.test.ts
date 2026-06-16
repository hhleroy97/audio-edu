import { describe, expect, it } from "vitest";
import {
  countSectionPresetEvents,
  runTimbreAgent,
  runTimbreRuntimeAgent,
} from "@/lib/song/agents";
import { RIDDIM_STANDARD_16, RIDDIM_SICK_DROP_16 } from "@/lib/song/agents/rule-packs";
import { runEvaluationAgent } from "@/lib/song/agents/evaluation-agent";
import { runArrangement } from "@/lib/song/agents/arrangement-agent";

describe("TimbreRuntimeAgent (#108)", () => {
  it("emits layerPreset at each section boundary", () => {
    const timbre = runTimbreAgent(RIDDIM_STANDARD_16);
    const sections = RIDDIM_STANDARD_16.sections.map((s) => ({
      id: s.id,
      label: s.label,
      startBar: s.startBar,
      endBar: s.endBar,
      events: [] as const,
    }));

    const result = runTimbreRuntimeAgent({
      sections,
      plans: timbre.plans,
      layerIds: new Set(timbre.layers.map((l) => l.id)),
    });

    const swaps = countSectionPresetEvents(result.sections);
    expect(swaps).toBeGreaterThanOrEqual(6);

    const intro = result.sections.find((s) => s.id === "intro");
    expect(intro?.events.some((e) => e.kind === "layerPreset" && e.layer === "body")).toBe(
      true
    );
    expect(intro?.events.find((e) => e.kind === "layerPreset" && e.layer === "body")).toMatchObject({
      presetId: "subfiltronik-loop",
    });
  });

  it("uses distinct body presets across intro and drop", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "timbre-runtime",
    });

    const intro = run.song.sections.find((s) => s.id === "intro");
    const drop = run.song.sections.find((s) => s.id === "drop-a");

    const introBody = intro?.events.find(
      (e) => e.kind === "layerPreset" && e.layer === "body"
    );
    const dropBody = drop?.events.find(
      (e) => e.kind === "layerPreset" && e.layer === "body"
    );

    expect(introBody?.presetId).toBe("subfiltronik-loop");
    expect(dropBody?.presetId).toBe("hydraulic-press-wobble");
    expect(introBody?.presetId).not.toBe(dropBody?.presetId);
  });

  it("includes top layer in song.layers when build/drop use it", () => {
    const timbre = runTimbreAgent(RIDDIM_STANDARD_16);
    expect(timbre.layers.some((l) => l.id === "top")).toBe(true);
  });

  it("passes minSectionPresetSwaps evaluation gate", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_SICK_DROP_16.id,
      seed: "eval-presets",
    });
    const report = runEvaluationAgent(run.song, RIDDIM_SICK_DROP_16);
    expect(report.metrics.sectionPresetSwaps).toBeGreaterThanOrEqual(6);
    expect(report.ok).toBe(true);
  });
});
