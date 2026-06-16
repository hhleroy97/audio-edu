"use client";

import type { ArrangementAgentEventType } from "@/lib/schemas/agents";
import { AgentStateIndicator, type AgentPhase } from "@/lib/ui/AgentStateIndicator";
import { PIPELINE_AGENT_ORDER } from "@/lib/song/agents/pipeline-yield";

const AGENT_LABELS: Record<string, string> = {
  section: "Sections",
  harmony: "Harmony",
  timbre: "Timbre",
  pattern: "Patterns",
  transition: "Transitions",
  groove: "Groove",
  drum: "Drums",
  automation: "Automation",
  modfx: "Mod / FX",
  evaluation: "Evaluation",
  mix: "Lint",
};

export type ArrangementPipelineStepperProps = {
  events: ArrangementAgentEventType[];
  busy: boolean;
  complete: boolean;
  failed: boolean;
};

function phaseForAgent(
  agentId: string,
  events: ArrangementAgentEventType[],
  busy: boolean,
  complete: boolean,
  failed: boolean
): AgentPhase {
  const ev = [...events].reverse().find((e) => e.agent === agentId);
  if (!ev) return "idle";
  if (ev.phase === "error" || (failed && ev.phase !== "done")) return "error";
  if (ev.phase === "start" || ev.phase === "lint") return busy ? "working" : "settled";
  if (complete && agentId === "mix" && ev.phase === "done") return "settled";
  if (ev.phase === "done") return "settled";
  return "idle";
}

export function ArrangementPipelineStepper({
  events,
  busy,
  complete,
  failed,
}: ArrangementPipelineStepperProps) {
  const lastEvent = events[events.length - 1];
  const stepIndex = lastEvent?.stepIndex ?? 0;
  const totalSteps = lastEvent?.totalSteps ?? PIPELINE_AGENT_ORDER.length;
  const progress =
    totalSteps > 0 ? Math.min(1, stepIndex / totalSteps) : undefined;

  const bannerPhase: AgentPhase = failed
    ? "error"
    : complete
      ? "settled"
      : busy
        ? "working"
        : "idle";

  const bannerMessage = failed
    ? "Generation failed"
    : complete
      ? "Generation complete"
      : busy
        ? `Generating · step ${stepIndex}/${totalSteps}`
        : "Ready to generate";

  return (
    <div className="mt-2 space-y-2">
      <AgentStateIndicator
        phase={bannerPhase}
        message={bannerMessage}
        progress={busy ? progress : complete ? 1 : undefined}
      />
      <ol className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {PIPELINE_AGENT_ORDER.map((id) => {
          const phase = phaseForAgent(id, events, busy, complete, failed);
          const ev = [...events].reverse().find((e) => e.agent === id);
          return (
            <li
              key={id}
              className={`border px-1 py-0.5 font-mono text-[7px] uppercase ${
                phase === "error"
                  ? "border-hot text-hot"
                  : phase === "working"
                    ? "border-hot text-hot animate-pulse"
                    : phase === "settled"
                      ? "border-cold text-cold"
                      : "border-module-border text-secondary/60"
              }`}
            >
              {AGENT_LABELS[id] ?? id}
              {ev?.message ? ` · ${ev.message}` : ""}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
