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

      {diagram === "envelope-pipeline" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Full effect pipeline">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <text x="12" y="18" fill={MUTED} fontSize="10" fontFamily="monospace">
            osc → detune → envelope → out
          </text>
          {[
            { x: 8, label: "osc", color: STROKE },
            { x: 72, label: "detune", color: "#a78bfa" },
            { x: 136, label: "env", color: "#e8343a" },
            { x: 200, label: "out", color: MUTED },
          ].map((box, i, arr) => (
            <g key={box.label}>
              <rect
                x={box.x}
                y="42"
                width="56"
                height="36"
                fill="#0a0612"
                stroke={box.color}
                strokeWidth="1.5"
              />
              <text
                x={box.x + 28}
                y="64"
                fill="#e8e4f0"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {box.label}
              </text>
              {i < arr.length - 1 && (
                <line
                  x1={box.x + 56}
                  y1="60"
                  x2={box.x + 68}
                  y2="60"
                  stroke={STROKE}
                  strokeWidth="2"
                />
              )}
            </g>
          ))}
          <text x="12" y="100" fill={MUTED} fontSize="9" fontFamily="monospace">
            stack effects to build complex timbres
          </text>
        </svg>
      )}

      {diagram === "envelope-adsr" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="ADSR amplitude envelope">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <text x="12" y="18" fill={MUTED} fontSize="10" fontFamily="monospace">
            amplitude over time
          </text>
          <polyline
            points="20,95 50,30 100,55 180,55 250,95"
            fill="none"
            stroke="#e8343a"
            strokeWidth="2"
          />
          <text x="24" y="108" fill={MUTED} fontSize="9" fontFamily="monospace">
            A
          </text>
          <text x="68" y="108" fill={MUTED} fontSize="9" fontFamily="monospace">
            D
          </text>
          <text x="130" y="108" fill={MUTED} fontSize="9" fontFamily="monospace">
            S
          </text>
          <text x="220" y="108" fill={MUTED} fontSize="9" fontFamily="monospace">
            R
          </text>
        </svg>
      )}

      {diagram === "detune-pipeline" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Osc detune output pipeline">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <text x="12" y="18" fill={MUTED} fontSize="10" fontFamily="monospace">
            osc → detune → output
          </text>
          {[
            { x: 24, label: "osc", color: STROKE },
            { x: 108, label: "detune", color: "#a78bfa" },
            { x: 192, label: "out", color: MUTED },
          ].map((box, i, arr) => (
            <g key={box.label}>
              <rect
                x={box.x}
                y="42"
                width="64"
                height="36"
                fill="#0a0612"
                stroke={box.color}
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
              {i < arr.length - 1 && (
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
            detune is an effect in the chain, not a separate source
          </text>
        </svg>
      )}

      {diagram === "unison-spread" && (
        <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Unison detune spread">
          <rect x="0" y="0" width="280" height="120" fill="#120d1a" stroke="#2a1f3d" />
          <text x="12" y="18" fill={MUTED} fontSize="10" fontFamily="monospace">
            one source → many detuned paths
          </text>
          <circle cx="140" cy="28" r="6" fill={STROKE} />
          {[
            { x: 56, y: 88, label: "−¢ L" },
            { x: 140, y: 72, label: "0" },
            { x: 224, y: 88, label: "+¢ R" },
          ].map((v) => (
            <g key={v.label}>
              <line x1="140" y1="28" x2={v.x} y2={v.y} stroke={`${STROKE}88`} strokeWidth="1.5" />
              <circle cx={v.x} cy={v.y} r="5" fill={STROKE} />
              <text x={v.x - 12} y={v.y + 18} fill={MUTED} fontSize="9" fontFamily="monospace">
                {v.label}
              </text>
            </g>
          ))}
          <text x="12" y="112" fill={MUTED} fontSize="9" fontFamily="monospace">
            detune widens pitch · spread pans voices in stereo
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
