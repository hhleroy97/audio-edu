"use client";

import { useEffect, useRef } from "react";
import { voiceLayout } from "@/lib/audio/unison-voice";

type UnisonSpreadDisplayProps = {
  voices: number;
  detune: number;
  spread: number;
  className?: string;
};

const STROKE = "#5ec8e8";
const MUTED = "#8a7fa0";
const BG = "#120d1a";
const GRID = "#2a1f3d";

export function UnisonSpreadDisplay({
  voices,
  detune,
  spread,
  className,
}: UnisonSpreadDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = { top: 14, right: 8, bottom: 16, left: 8 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const sourceX = pad.left + plotW / 2;
    const sourceY = pad.top + 6;
    const rowY = pad.top + plotH * 0.72;
    const maxDetune = Math.max(detune, 1);

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, rowY);
    ctx.lineTo(pad.left + plotW, rowY);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = "9px monospace";
    ctx.fillText("L", pad.left, h - 4);
    ctx.fillText("R", pad.left + plotW - 8, h - 4);
    ctx.fillText("detune paths", pad.left, 10);

    const layout = voiceLayout(voices, detune, spread);

    layout.forEach((voice) => {
      const x = pad.left + ((voice.pan + 1) / 2) * plotW;
      const detuneNorm = voice.detuneCents / (maxDetune / 2);
      const y = rowY - detuneNorm * (plotH * 0.22);

      ctx.strokeStyle = `${STROKE}88`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillStyle = STROKE;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = MUTED;
      ctx.font = "8px monospace";
      const label =
        voice.detuneCents === 0
          ? "0"
          : `${voice.detuneCents > 0 ? "+" : ""}${voice.detuneCents.toFixed(0)}¢`;
      ctx.fillText(label, x - 10, y - 8);
    });

    ctx.fillStyle = STROKE;
    ctx.beginPath();
    ctx.arc(sourceX, sourceY, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [voices, detune, spread]);

  return (
    <canvas
      ref={canvasRef}
      width={168}
      height={72}
      className={className}
      role="img"
      aria-label={`Unison spread: ${voices} voices, ${detune} cents detune`}
    />
  );
}
