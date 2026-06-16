import { z } from "zod";
import { SongDef } from "./song";

/** Which specialist ran in an arrangement pass. */
export const ArrangementSubAgentId = z.enum([
  "section",
  "harmony",
  "timbre",
  "pattern",
  "melody",
  "transition",
  "groove",
  "timbreRuntime",
  "drum",
  "automation",
  "modfx",
  "evaluation",
  "mix",
]);

export type ArrangementSubAgentIdType = z.infer<typeof ArrangementSubAgentId>;

export const AgentGate = z.enum(["auto", "human-review"]);
export type AgentGateType = z.infer<typeof AgentGate>;

/** Progress event for arrangement UI (red = working, blue = settled). */
export const ArrangementAgentEvent = z.object({
  agent: ArrangementSubAgentId,
  phase: z.enum(["start", "lint", "done", "error"]),
  message: z.string().optional(),
  at: z.number(),
  stepIndex: z.number().int().min(0).optional(),
  totalSteps: z.number().int().min(1).optional(),
  runPhase: z.enum(["running", "complete", "failed"]).optional(),
});

export type ArrangementAgentEventType = z.infer<typeof ArrangementAgentEvent>;

/** User-facing generate request — deterministic when seed is set. */
export const ArrangementRequest = z.object({
  rulePackId: z.string(),
  seed: z.string().default("default"),
  bpm: z.number().positive().optional(),
  bars: z.number().int().positive().optional(),
  key: z.string().optional(),
  /** Run mix sub-agent after merge (respects MixDef gate). */
  runMixPass: z.boolean().default(false),
  /** Re-run pipeline with seed suffix when EvaluationAgent fails. */
  maxEvalRetries: z.number().int().min(0).max(3).default(0),
});

export type ArrangementRequestType = z.infer<typeof ArrangementRequest>;

/** Full arrangement run artifact. */
export const ArrangementRun = z.object({
  id: z.string(),
  request: ArrangementRequest,
  song: SongDef,
  events: z.array(ArrangementAgentEvent).default([]),
  inputsHash: z.string().optional(),
  gate: AgentGate.default("human-review"),
});

export type ArrangementRunType = z.infer<typeof ArrangementRun>;
