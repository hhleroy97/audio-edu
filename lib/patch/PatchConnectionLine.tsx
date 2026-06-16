"use client";

import type { ConnectionLineComponentProps } from "@xyflow/react";
import { buildPatchCablePath } from "@/lib/patch/cable-path";
import { PORT_COLORS } from "@/lib/patch/ports";

/** Live patch cord preview while dragging from a port. */
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
        stroke="#0a0612"
        strokeWidth={6}
        strokeLinecap="square"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="square"
        strokeOpacity={0.9}
      />
      <rect
        x={fromX - 3}
        y={fromY - 3}
        width={6}
        height={6}
        fill="#0a0612"
        stroke={color}
        strokeWidth={1.5}
      />
    </g>
  );
}
