"use client";

import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { PORT_COLORS } from "@/lib/patch/ports";
import type { PortType } from "@/lib/schemas/patch";
import { buildPatchCablePath } from "@/lib/patch/cable-path";

const CABLE_DASH: Record<PortType, string | undefined> = {
  audio: undefined,
  cv: "8 5",
  trigger: "3 4",
};

function CableEndpoint({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <rect
      x={x - 3}
      y={y - 3}
      width={6}
      height={6}
      fill="#0a0612"
      stroke={color}
      strokeWidth={1.5}
    />
  );
}

export function PatchCable({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps) {
  const path = buildPatchCablePath(sourceX, sourceY, targetX, targetY);
  const signal = (data?.signal as PortType) ?? "audio";
  const color = PORT_COLORS[signal] ?? PORT_COLORS.audio;
  const strokeWidth = selected ? 5 : 4;
  const outlineWidth = selected ? 7 : 6;

  return (
    <>
      <BaseEdge
        id={`${id}-outline`}
        path={path}
        style={{
          stroke: "#0a0612",
          strokeWidth: outlineWidth,
          strokeLinecap: "square",
          strokeLinejoin: "miter",
        }}
      />
      <BaseEdge
        id={id}
        path={path}
        className="patch-cable"
        style={{
          stroke: color,
          strokeWidth,
          strokeLinecap: "square",
          strokeLinejoin: "miter",
          strokeDasharray: CABLE_DASH[signal],
        }}
        data-signal={signal}
      />
      <g className="patch-cable-ends pointer-events-none">
        <CableEndpoint x={sourceX} y={sourceY} color={color} />
        <CableEndpoint x={targetX} y={targetY} color={color} />
      </g>
    </>
  );
}

export const patchEdgeTypes = {
  patchCable: PatchCable,
};
