"use client";

import { memo } from "react";
import { Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_COLORS } from "@/lib/patch/ports";
import { PortHandle } from "@/lib/patch/PortHandle";
import { usePatchStore } from "@/lib/patch/store";
import type { PatchNodeData } from "@/lib/patch/ports";

type AudioNodeShellProps = NodeProps & {
  children?: React.ReactNode;
  inputs?: { id: string; signal: "audio" | "cv" | "trigger"; label: string }[];
  outputs?: { id: string; signal: "audio" | "cv" | "trigger"; label: string }[];
};

export const AudioNodeShell = memo(function AudioNodeShell({
  id,
  data,
  selected,
  children,
  inputs = [],
  outputs = [],
}: AudioNodeShellProps) {
  const kind = (data as PatchNodeData).kind;
  const color = NODE_COLORS[kind] ?? "#8a7fa0";

  return (
    <div
      className={cn(
        "min-w-[180px] border bg-surface font-mono text-xs shadow-lg",
        selected ? "border-cold ring-1 ring-cold/40" : "border-border"
      )}
      data-tour-id={`node-${kind}`}
    >
      <div
        className="border-b border-border px-3 py-2 uppercase tracking-wider"
        style={{ color }}
      >
        {(data as PatchNodeData).label}
      </div>
      <div className="relative px-3 py-3">
        {inputs.map((port) => (
          <div key={port.id} className="mb-2 flex items-center gap-2">
            <PortHandle
              type="target"
              position={Position.Left}
              id={port.id}
              signal={port.signal}
            />
            <span className="text-secondary">{port.label}</span>
          </div>
        ))}
        {children}
        {outputs.map((port) => (
          <div key={port.id} className="mt-2 flex items-center justify-end gap-2">
            <span className="text-secondary">{port.label}</span>
            <PortHandle
              type="source"
              position={Position.Right}
              id={port.id}
              signal={port.signal}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export function OscillatorFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const params = (props.data as PatchNodeData).params;

  return (
    <AudioNodeShell
      {...props}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <label className="mb-2 flex flex-col gap-1">
        <span className="text-secondary">wave</span>
        <select
          className="border border-border bg-base px-2 py-1 text-primary"
          value={String(params.waveform ?? "sine")}
          onChange={(e) =>
            update(props.id, { waveform: e.target.value })
          }
        >
          <option value="sine">sine</option>
          <option value="square">square</option>
          <option value="sawtooth">sawtooth</option>
          <option value="triangle">triangle</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-secondary">
          {Number(params.frequency ?? 220).toFixed(0)} Hz
        </span>
        <input
          type="range"
          min={55}
          max={880}
          value={Number(params.frequency ?? 220)}
          onChange={(e) =>
            update(props.id, { frequency: Number(e.target.value) })
          }
          className="accent-cold"
        />
      </label>
    </AudioNodeShell>
  );
}

export function OutputFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const params = (props.data as PatchNodeData).params;

  return (
    <AudioNodeShell
      {...props}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
    >
      <label className="flex flex-col gap-1">
        <span className="text-secondary">
          master {(Number(params.gain ?? 0.8) * 100).toFixed(0)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={Number(params.gain ?? 0.8)}
          onChange={(e) => update(props.id, { gain: Number(e.target.value) })}
          className="accent-cold"
        />
      </label>
    </AudioNodeShell>
  );
}

export function AnalyserFlowNode(props: NodeProps) {
  return (
    <AudioNodeShell
      {...props}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <p className="text-secondary">scope tap</p>
    </AudioNodeShell>
  );
}

export const patchNodeTypes = {
  oscillator: OscillatorFlowNode,
  output: OutputFlowNode,
  analyser: AnalyserFlowNode,
};
