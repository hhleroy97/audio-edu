"use client";

import { memo, useEffect, useRef, type ReactNode } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ModuleJack, jackSlotPercent } from "@/lib/patch/ModuleJack";
import { usePatchStore } from "@/lib/patch/store";
import { NODE_LAYOUT_METADATA } from "@/lib/patch/node-layout";
import { getModuleTheme } from "@/lib/patch/module-theme";
import type { PatchNodeData, NodeKind } from "@/lib/patch/ports";
import type { PortType } from "@/lib/schemas/patch";

type PortDef = { id: string; signal: PortType; label: string };

type ModuleShellProps = {
  id: string;
  kind: NodeKind;
  label: string;
  selected?: boolean;
  children?: ReactNode;
  inputs?: PortDef[];
  outputs?: PortDef[];
};

export const ModuleShell = memo(function ModuleShell({
  id,
  kind,
  label,
  selected,
  children,
  inputs = [],
  outputs = [],
}: ModuleShellProps) {
  const theme = getModuleTheme(kind);
  const shellRef = useRef<HTMLDivElement>(null);
  const registerNodeSize = usePatchStore((s) => s.registerNodeSize);
  const updateNodeInternals = useUpdateNodeInternals();
  const shellWidth = NODE_LAYOUT_METADATA[kind].width;
  const hasInputs = inputs.length > 0;
  const hasOutputs = outputs.length > 0;

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const reportHeight = (height: number) => {
      registerNodeSize(id, kind, height);
      if (hasInputs || hasOutputs) {
        updateNodeInternals(id);
      }
    };

    reportHeight(el.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const height =
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      reportHeight(height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, kind, registerNodeSize, hasInputs, hasOutputs, updateNodeInternals]);

  useEffect(() => {
    if (!hasInputs && !hasOutputs) return;
    updateNodeInternals(id);
  }, [id, hasInputs, hasOutputs, inputs.length, outputs.length, updateNodeInternals]);

  return (
    <div
      ref={shellRef}
      className={cn(
        "module-panel relative box-border overflow-visible text-xs",
        `module-panel--${kind}`,
        (hasInputs || hasOutputs) && "module-panel--has-io",
        selected && "module-panel--selected"
      )}
      style={{ width: shellWidth, minWidth: shellWidth }}
      data-tour-id={`node-${kind}`}
      data-patch-node-id={id}
      data-module-code={theme.code}
    >
      <header className="module-panel__header flex items-center gap-2 px-2 py-1.5">
        <span className="module-panel__code shrink-0">{theme.code}</span>
        <span className="module-panel__name truncate uppercase">{label}</span>
        <span
          className={cn(
            "module-panel__state ml-auto shrink-0",
            selected && "module-panel__state--on"
          )}
          aria-hidden
        />
      </header>

      <div className="module-panel__body px-2 pb-2 pt-1.5">
        <div className="module-panel__controls space-y-2">{children}</div>
      </div>

      {(hasInputs || hasOutputs) && (
        <footer className="module-panel__io" aria-label="Patch I/O">
          {inputs.map((port, index) => (
            <ModuleJack
              key={port.id}
              type="target"
              role="in"
              id={port.id}
              signal={port.signal}
              slot={jackSlotPercent(index, inputs.length, "in")}
              label={port.label}
            />
          ))}
          {outputs.map((port, index) => (
            <ModuleJack
              key={port.id}
              type="source"
              role="out"
              id={port.id}
              signal={port.signal}
              slot={jackSlotPercent(index, outputs.length, "out")}
              label={port.label}
            />
          ))}
        </footer>
      )}
    </div>
  );
});

export function ModuleDisplay({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "module-display nodrag nopan w-full border-2 border-module-border bg-module-inset p-1",
        className
      )}
    >
      {children}
    </div>
  );
}
