import { describe, expect, it } from "vitest";
import {
  ArrangementRequest,
  ArrangementRun,
  ArrangementAgentEvent,
} from "@/lib/schemas/agents";
import { SongDef } from "@/lib/schemas/song";

describe("arrangement agent schemas", () => {
  it("parses ArrangementRequest with defaults", () => {
    const req = ArrangementRequest.parse({ rulePackId: "riddim-standard-16" });
    expect(req.seed).toBe("default");
    expect(req.runMixPass).toBe(false);
  });

  it("parses ArrangementRun with nested SongDef", () => {
    const song = SongDef.parse({
      meta: {
        id: "gen-test",
        title: "Gen Test",
        bpm: 140,
        bars: 8,
        beatsPerBar: 4,
        gate: "human-review",
        version: 2,
      },
      schemaVersion: 2,
      layers: [{ id: "sub", presetId: "clean-sub" }],
      sections: [{ id: "drop", label: "Drop", startBar: 0, endBar: 8 }],
    });
    const run = ArrangementRun.parse({
      id: "run-1",
      request: { rulePackId: "riddim-standard-16" },
      song,
      events: [
        ArrangementAgentEvent.parse({
          agent: "pattern",
          phase: "done",
          at: Date.now(),
        }),
      ],
    });
    expect(run.gate).toBe("human-review");
    expect(run.events).toHaveLength(1);
  });
});
