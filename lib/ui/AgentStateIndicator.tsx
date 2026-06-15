"use client";

import { cn } from "@/lib/utils";

export type AgentPhase = "idle" | "working" | "settled" | "error";

type AgentStateIndicatorProps = {
  phase: AgentPhase;
  message: string;
  progress?: number;
  className?: string;
};

const PHASE_STYLES: Record<AgentPhase, string> = {
  idle: "border-border text-secondary",
  working: "border-hot text-hot animate-pulse",
  settled: "border-cold text-cold",
  error: "border-hot bg-hot/10 text-hot",
};

export function AgentStateIndicator({
  phase,
  message,
  progress,
  className,
}: AgentStateIndicatorProps) {
  return (
    <div
      className={cn(
        "border px-3 py-2 font-mono text-xs uppercase tracking-wider",
        PHASE_STYLES[phase],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        {progress !== undefined && phase === "working" && (
          <span>{Math.round(progress * 100)}%</span>
        )}
      </div>
      {progress !== undefined && phase === "working" && (
        <div className="mt-2 h-0.5 w-full bg-border">
          <div
            className="h-full bg-hot transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
