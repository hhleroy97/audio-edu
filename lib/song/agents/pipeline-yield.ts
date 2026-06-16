/** Yield to the event loop so React can paint progress between sub-agents. */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export const PIPELINE_AGENT_ORDER = [
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
] as const;

export const PIPELINE_TOTAL_STEPS = PIPELINE_AGENT_ORDER.length;

export function stepIndexForAgent(agent: string): number {
  const idx = PIPELINE_AGENT_ORDER.indexOf(agent as (typeof PIPELINE_AGENT_ORDER)[number]);
  return idx >= 0 ? idx + 1 : 0;
}
