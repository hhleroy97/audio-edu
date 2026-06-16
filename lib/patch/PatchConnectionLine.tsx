"use client";

import type { ConnectionLineComponentProps } from "@xyflow/react";
import { buildPatchCablePath } from "@/lib/patch/cable-path";
import { PORT_COLORS } from "@/lib/patch/ports";

/** Live patch cord preview while dragging from a jack. */
export function PatchConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  const path = buildPatchCablePath(fromX, fromY, toX, toY);
  const color = PORT_COLORS.audio;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="#000000"
        strokeWidth={10}
        strokeOpacity={0.4}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeOpacity={0.35}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeOpacity={0.75}
        strokeLinecap="round"
      />
      <circle cx={fromX} cy={fromY} r={5} fill="#14101c" stroke={color} strokeWidth={1.5} />
    </g>
  );
}
