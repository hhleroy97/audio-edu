import { Handle, Position } from "@xyflow/react";
import { PORT_COLORS } from "@/lib/patch/ports";
import type { PortType } from "@/lib/schemas/patch";
import { cn } from "@/lib/utils";

/** I/O strip height — jack mount is vertically centered inside. */
export const MODULE_IO_STRIP_PX = 72;
export const JACK_SOCKET_PX = 36;

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
 * Jack visual + RF handle share one mount box so drag targets match the insert.
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
        "module-jack-mount",
        role === "in" ? "module-jack-mount--in" : "module-jack-mount--out"
      )}
      style={
        {
          "--jack-slot": slot,
          "--jack-color": color,
        } as React.CSSProperties
      }
      data-signal={signal}
    >
      <div className="module-jack__socket pointer-events-none" aria-hidden>
        <span className="module-jack__bezel" />
        <span className="module-jack__collar" />
        <span className="module-jack__insulator" />
        <span className="module-jack__well">
          <span className="module-jack__sleeve" />
          <span className="module-jack__contact" />
        </span>
        <span className="module-jack__glint" aria-hidden />
      </div>

      <Handle
        type={type}
        position={Position.Bottom}
        id={id}
        className="module-jack__handle nodrag"
        data-tour-id={`port-${id}`}
        data-signal={signal}
      />

      <span className="module-jack__label pointer-events-none">{label}</span>
    </div>
  );
}
