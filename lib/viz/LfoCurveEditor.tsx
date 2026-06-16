"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_LFO_CURVE,
  encodeCurvePoints,
  parseCurvePoints,
  type LfoCurvePoint,
} from "@/lib/patch/lfo-curve";

type LfoCurveEditorProps = {
  value?: string;
  onChange: (encoded: string) => void;
  className?: string;
};

const W = 200;
const H = 56;

export function LfoCurveEditor({
  value = DEFAULT_LFO_CURVE,
  onChange,
  className,
}: LfoCurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<LfoCurvePoint[]>(() =>
    parseCurvePoints(value)
  );
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    setPoints(parseCurvePoints(value));
  }, [value]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0612";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#1e1830";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const x = (i / 4) * W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    ctx.strokeStyle = "#5ec8e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) {
      const t = x / W;
      let y = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        if (t >= a.x && t <= b.x) {
          const span = b.x - a.x || 1;
          const u = (t - a.x) / span;
          y = a.y + (b.y - a.y) * u;
          break;
        }
      }
      const py = H - y * (H - 8) - 4;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();

    for (const p of points) {
      const px = p.x * W;
      const py = H - p.y * (H - 8) - 4;
      ctx.fillStyle = "#ff006e";
      ctx.fillRect(px - 3, py - 3, 6, 6);
      ctx.strokeStyle = "#e8e4dc";
      ctx.strokeRect(px - 3, py - 3, 6, 6);
    }
  }, [points]);

  useEffect(() => {
    draw();
  }, [draw]);

  const pickPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;

    let best = -1;
    let bestDist = 12;
    points.forEach((p, i) => {
      const px = p.x * W;
      const py = H - p.y * (H - 8) - 4;
      const d = Math.hypot(px - x, py - y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best >= 0 ? best : null;
  };

  const updatePoint = (index: number, clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let nx = (clientX - rect.left) / rect.width;
    let ny = 1 - ((clientY - rect.top) / rect.height - 4 / H) / (1 - 8 / H);
    nx = Math.max(0, Math.min(1, nx));
    ny = Math.max(0, Math.min(1, ny));

    const next = [...points];
    const isEdge = index === 0 || index === points.length - 1;
    if (isEdge) {
      next[index] = { x: index === 0 ? 0 : 1, y: ny };
    } else {
      const prevX = next[index - 1].x + 0.02;
      const nextX = next[index + 1].x - 0.02;
      next[index] = { x: Math.max(prevX, Math.min(nextX, nx)), y: ny };
    }
    setPoints(next);
    onChange(encodeCurvePoints(next));
  };

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={className ?? "w-full border-2 border-module-border bg-module-header"}
      onPointerDown={(e) => {
        dragIndex.current = pickPoint(e.clientX, e.clientY);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (dragIndex.current === null) return;
        updatePoint(dragIndex.current, e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        dragIndex.current = null;
      }}
    />
  );
}
