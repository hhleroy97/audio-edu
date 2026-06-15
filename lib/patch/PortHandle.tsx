import { Handle, Position } from "@xyflow/react";
import { PORT_COLORS } from "@/lib/patch/ports";
import type { PortType } from "@/lib/schemas/patch";

type PortHandleProps = {
  type: "source" | "target";
  position: Position;
  id: string;
  signal: PortType;
};

/** Typed port dot with ambient glow — readable on dark canvas. */
export function PortHandle({ type, position, id, signal }: PortHandleProps) {
  const color = PORT_COLORS[signal];

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className="!h-3.5 !w-3.5 !border-2 !rounded-full transition-shadow hover:!scale-110"
      style={{
        borderColor: color,
        backgroundColor: `${color}40`,
        boxShadow: [
          `0 0 0 2px rgba(10, 6, 18, 0.9)`,
          `0 0 8px ${color}`,
          `0 0 18px ${color}66`,
        ].join(", "),
      }}
      data-tour-id={`port-${id}`}
    />
  );
}
