"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { PORT_COLORS } from "@/lib/patch/ports";

export function PatchCable({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const signal = (data?.signal as keyof typeof PORT_COLORS) ?? "audio";
  const color = PORT_COLORS[signal] ?? PORT_COLORS.audio;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: color,
        strokeWidth: selected ? 3 : 2,
        strokeDasharray: selected ? undefined : "6 4",
        animation: "dash 1s linear infinite",
      }}
      markerEnd={`url(#arrow-${signal})`}
    />
  );
}

export const patchEdgeTypes = {
  patchCable: PatchCable,
};
