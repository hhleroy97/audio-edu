"use client";

import type { LessonDiagram as DiagramId } from "@/lib/schemas/patch";

type LessonDiagramProps = {
  diagram: DiagramId;
  className?: string;
};

const STROKE = "#5ec8e8";
const MUTED = "#8a7fa0";

export function LessonDiagram({ diagram, className }: LessonDiagramProps) {
  return (
    <div
      className={className}
      aria-hidden
    >
      {diagram === "oscillator-intro" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Sine wave oscillator">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <text x="12" y="18" fill={MUTED} fontSize="10" fontFamily="monospace">
            periodic motion → sound
          </text>
          <path
            d="M 20 60 C 50 20, 70 100, 100 60 S 150 20, 180 60 S 230 100, 260 60"
            fill="none"
            stroke={STROKE}
            strokeWidth="2"
          />
          <line x1="20" y1="60" x2="260" y2="60" stroke="#2a1f3d" strokeDasharray="4 4" />
          <text x="20" y="108" fill={MUTED} fontSize="9" fontFamily="monospace">
            +1
          </text>
          <text x="20" y="78" fill={MUTED} fontSize="9" fontFamily="monospace">
            0
          </text>
        </svg>
      )}

      {diagram === "audio-ports" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Audio port types">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <rect x="24" y="36" width="100" height="48" fill="#0a0612" stroke="#2a1f3d" />
          <circle cx="24" cy="60" r="8" fill="#5ec8e840" stroke={STROKE} strokeWidth="2" />
          <text x="40" y="64" fill={MUTED} fontSize="10" fontFamily="monospace">
            in
          </text>
          <text x="72" y="64" fill="#e8e4f0" fontSize="10" fontFamily="monospace">
            node
          </text>
          <circle cx="124" cy="60" r="8" fill="#5ec8e840" stroke={STROKE} strokeWidth="2" />
          <text x="148" y="48" fill={STROKE} fontSize="10" fontFamily="monospace">
            audio
          </text>
          <text x="148" y="64" fill={MUTED} fontSize="9" fontFamily="monospace">
            main signal path
          </text>
          <line x1="132" y1="60" x2="200" y2="60" stroke={STROKE} strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="208" cy="60" r="8" fill="#5ec8e840" stroke={STROKE} strokeWidth="2" />
        </svg>
      )}

      {diagram === "signal-chain" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Signal chain routing">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          {[
            { x: 16, label: "osc" },
            { x: 108, label: "tap" },
            { x: 200, label: "out" },
          ].map((box, i) => (
            <g key={box.label}>
              <rect
                x={box.x}
                y="42"
                width="64"
                height="36"
                fill="#0a0612"
                stroke={STROKE}
                strokeWidth="1.5"
              />
              <text
                x={box.x + 32}
                y="64"
                fill="#e8e4f0"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {box.label}
              </text>
              {i < 2 && (
                <line
                  x1={box.x + 64}
                  y1="60"
                  x2={box.x + 92}
                  y2="60"
                  stroke={STROKE}
                  strokeWidth="2"
                />
              )}
            </g>
          ))}
          <text x="12" y="100" fill={MUTED} fontSize="9" fontFamily="monospace">
            audio flows left → right through the graph
          </text>
        </svg>
      )}

      {diagram === "run-transport" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Run transport">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <rect x="24" y="32" width="72" height="32" fill="none" stroke={STROKE} strokeWidth="1.5" />
          <polygon points="44,40 44,56 58,48" fill={STROKE} />
          <text x="44" y="82" fill={STROKE} fontSize="10" fontFamily="monospace">
            ▷ Run
          </text>
          <path
            d="M 120 70 L 130 50 L 140 65 L 150 45 L 160 70"
            fill="none"
            stroke={STROKE}
            strokeWidth="1.5"
          />
          <text x="120" y="100" fill={MUTED} fontSize="9" fontFamily="monospace">
            scopes animate when audio is live
          </text>
        </svg>
      )}

      {diagram === "lesson-complete" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Lesson complete">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <circle cx="60" cy="60" r="28" fill="none" stroke={STROKE} strokeWidth="2" />
          <path
            d="M 44 60 L 54 72 L 78 48"
            fill="none"
            stroke={STROKE}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text x="110" y="56" fill="#e8e4f0" fontSize="11" fontFamily="monospace">
            signal path learned
          </text>
          <text x="110" y="76" fill={MUTED} fontSize="9" fontFamily="monospace">
            playground unlocked
          </text>
        </svg>
      )}
    </div>
  );
}
