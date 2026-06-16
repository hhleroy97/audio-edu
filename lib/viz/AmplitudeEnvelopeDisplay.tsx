"use client";

import { useEffect, useRef } from "react";
import {
  sampleAmplitudeEnvelope,
  type AmplitudeADSR,
} from "@/lib/audio/adsr-amplitude";

type AmplitudeEnvelopeDisplayProps = {
  adsr: AmplitudeADSR;
  className?: string;
};

export function AmplitudeEnvelopeDisplay({
  adsr,
  className,
}: AmplitudeEnvelopeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = { left: 6, right: 6, top: 12, bottom: 14 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const samples = sampleAmplitudeEnvelope(adsr);

    ctx.fillStyle = "#120d1a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#2a1f3d";
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    ctx.fillStyle = "#8a7fa0";
    ctx.font = "9px monospace";
    ctx.fillText("A", pad.left, 10);
    ctx.fillText("D", pad.left + plotW * 0.22, 10);
    ctx.fillText("S", pad.left + plotW * 0.5, 10);
    ctx.fillText("R", pad.left + plotW * 0.82, 10);

    ctx.strokeStyle = "#e8343a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = pad.left + (s.t / 1.6) * plotW;
      const y = pad.top + plotH - s.level * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [adsr]);

  return (
    <canvas
      ref={canvasRef}
      width={168}
      height={64}
      className={className}
      role="img"
      aria-label="Amplitude envelope ADSR curve"
    />
  );
}
