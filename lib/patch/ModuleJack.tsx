import { Handle, Position } from "@xyflow/react";
import { PORT_COLORS } from "@/lib/patch/ports";
import type { PortType } from "@/lib/schemas/patch";
import { cn } from "@/lib/utils";

/** I/O strip height — port mount is vertically centered inside. */
export const MODULE_IO_STRIP_PX = 56;
export const JACK_SOCKET_PX = 28;

/** Horizontal slot along the bottom I/O strip (inputs left, outputs right). */
export function jackSlotPercent(
  index: number,
  total: number,
  role: "in" | "out"
): string {
  const inStart = 14;
  const inEnd = 40;
  const outStart = 60;
  const outEnd = 86;
  const start = role === "in" ? inStart : outStart;
  const end = role === "in" ? inEnd : outEnd;
  if (total <= 1) return `${(start + end) / 2}%`;
  const t = (index + 1) / (total + 1);
  return `${start + (end - start) * t}%`;
}

type ModuleJackProps = {
  type: "source" | "target";
  role: "in" | "out";
  id: string;
  signal: PortType;
  slot: string;
  label: string;
};

/**
 * Shape-coded port tile + RF handle in the same mount box.
 * Square = input, triangle = output.
 */
export function ModuleJack({
  type,
  role,
  id,
  signal,
  slot,
  label,
}: ModuleJackProps) {
  const color = PORT_COLORS[signal];

  return (
    <div
      className={cn(
        "module-port-mount",
        role === "in" ? "module-port-mount--in" : "module-port-mount--out"
      )}
      style={
        {
          "--port-slot": slot,
          "--port-color": color,
        } as React.CSSProperties
      }
      data-signal={signal}
      data-port-role={role}
    >
      <div
        className={cn(
          "module-port pointer-events-none",
          role === "in" ? "module-port--in" : "module-port--out"
        )}
        aria-hidden
      >
        <span className="module-port__core" />
      </div>

      <Handle
        type={type}
        position={Position.Bottom}
        id={id}
        className="module-port__handle nodrag"
        data-tour-id={`port-${id}`}
        data-signal={signal}
      />

      <span className="module-port__label pointer-events-none">{label}</span>
    </div>
  );
}
