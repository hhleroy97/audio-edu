"use client";

import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { PORT_COLORS } from "@/lib/patch/ports";
import {
  buildPatchCablePath,
} from "@/lib/patch/cable-path";

const CABLE_WIDTH = { shadow: 10, sheath: 7, core: 4, highlight: 1.25 } as const;
const CABLE_WIDTH_SELECTED = { shadow: 12, sheath: 8.5, core: 5, highlight: 1.5 } as const;

function CablePlug({
  x,
  y,
  color,
  angle,
}: {
  x: number;
  y: number;
  color: string;
  angle: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      {/* Cable body hanging toward viewer */}
      <rect
        x={-5}
        y={0}
        width={10}
        height={9}
        rx={1.5}
        fill="#14101c"
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Plug barrel seated in jack bore */}
      <rect
        x={-4}
        y={-9}
        width={8}
        height={9}
        rx={1}
        fill="#2a2538"
        stroke={color}
        strokeWidth={1.25}
      />
      <circle cx={0} cy={-10} r={2.75} fill={color} opacity={0.95} />
      <circle cx={0} cy={-10} r={1.25} fill="#c8b890" opacity={0.9} />
    </g>
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
  const signal = (data?.signal as keyof typeof PORT_COLORS) ?? "audio";
  const color = PORT_COLORS[signal] ?? PORT_COLORS.audio;
  const widths = selected ? CABLE_WIDTH_SELECTED : CABLE_WIDTH;
  /** Tip points into jack bore; body hangs toward viewer. */
  const plugAngle = 0;

  return (
    <>
      <BaseEdge
        id={`${id}-shadow`}
        path={path}
        style={{
          stroke: "#000000",
          strokeWidth: widths.shadow,
          strokeOpacity: 0.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      <BaseEdge
        id={`${id}-sheath`}
        path={path}
        style={{
          stroke: color,
          strokeWidth: widths.sheath,
          strokeOpacity: 0.4,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      <BaseEdge
        id={`${id}-core`}
        path={path}
        className="patch-cable"
        style={{
          stroke: color,
          strokeWidth: widths.core,
          strokeOpacity: 0.92,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          filter: selected ? `drop-shadow(0 0 6px ${color})` : undefined,
        }}
        data-signal={signal}
      />
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: "#ffffff",
          strokeWidth: widths.highlight,
          strokeOpacity: 0.12,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      <g className="patch-cable-plugs pointer-events-none">
        <CablePlug x={sourceX} y={sourceY} color={color} angle={plugAngle} />
        <CablePlug x={targetX} y={targetY} color={color} angle={plugAngle} />
      </g>
    </>
  );
}

export const patchEdgeTypes = {
  patchCable: PatchCable,
};
