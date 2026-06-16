/** Droop cable path — drops from forward-facing jacks, sags in front of the rack. */
export function buildPatchCablePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  const dx = targetX - sourceX;
  const dist = Math.hypot(dx, targetY - sourceY);
  const drop = Math.min(40, Math.max(18, dist * 0.07));
  const sag = Math.min(80, 24 + dist * 0.16);

  const sx = sourceX;
  const sy = sourceY + drop;
  const tx = targetX;
  const ty = targetY + drop;

  const c1x = sx + dx * 0.22;
  const c1y = sy + sag * 0.55;
  const c2x = tx - dx * 0.22;
  const c2y = ty + sag * 0.55;

  return `M ${sourceX} ${sourceY} L ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${tx} ${ty} L ${targetX} ${targetY}`;
}

/** Tangent angle (deg) at path start/end for plug orientation into faceplate jacks. */
export function cableEndpointAngle(
  _fromX: number,
  _fromY: number,
  _toX: number,
  _toY: number,
  end: "start" | "end"
): number {
  return end === "start" ? 90 : 270;
}
