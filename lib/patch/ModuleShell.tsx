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

function ModuleScrew({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 h-1.5 w-1.5 rounded-full border border-[#3a3548] bg-[#1a1624]",
        className
      )}
      aria-hidden
    />
  );
}

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
        "module-panel relative box-border overflow-visible font-mono text-xs",
        `module-panel--${kind}`,
        (hasInputs || hasOutputs) && "module-panel--has-io",
        selected && "module-panel--selected"
      )}
      style={
        {
          width: shellWidth,
          minWidth: shellWidth,
          "--module-accent": theme.accent,
          "--module-accent-dim": theme.accentDim,
          "--module-panel": theme.panel,
          "--module-led": theme.led,
        } as React.CSSProperties
      }
      data-tour-id={`node-${kind}`}
      data-patch-node-id={id}
      data-module-code={theme.code}
    >
      <div
        className="module-panel__face relative"
        style={{ clipPath: theme.clipPath }}
      >
        <ModuleScrew className="left-1.5 top-1.5" />
        <ModuleScrew className="right-1.5 top-1.5" />
        <ModuleScrew className="bottom-1.5 left-1.5" />
        <ModuleScrew className="bottom-1.5 right-1.5" />

        <header
          className={cn(
            "module-panel__header relative flex items-center gap-2 px-3 py-2",
            theme.slash === 1 ? "module-panel__header--slash-r" : "module-panel__header--slash-l"
          )}
        >
          <span
            className="module-panel__code shrink-0 px-1.5 py-0.5 text-[10px] font-bold tracking-widest"
            style={{ color: theme.accent, borderColor: theme.accent }}
          >
            {theme.code}
          </span>
          <span className="module-panel__name truncate uppercase tracking-[0.2em] text-primary/90">
            {label}
          </span>
          <span
            className={cn(
              "module-panel__led ml-auto h-2 w-2 shrink-0",
              selected && "module-panel__led--on"
            )}
            aria-hidden
          />
        </header>

        <div className="module-panel__body relative px-3 pb-2 pt-2">
          <div className="module-panel__controls space-y-2">{children}</div>
        </div>
      </div>

      {(hasInputs || hasOutputs) && (
        <footer className="module-panel__io relative" aria-label="Patch I/O">
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
        "module-display nodrag nopan w-full border border-[#2a2038] bg-[#06040c] p-1",
        className
      )}
    >
      {children}
    </div>
  );
}
