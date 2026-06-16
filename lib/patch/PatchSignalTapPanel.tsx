"use client";

import { getModuleTheme } from "@/lib/patch/module-theme";
import {
  listScopeTapCandidates,
  resolveDefaultScopeTapId,
} from "@/lib/patch/scope-tap";
import { usePatchStore } from "@/lib/patch/store";

export function PatchSignalTapPanel() {
  const nodes = usePatchStore((s) => s.nodes);
  const scopeTapNodeId = usePatchStore((s) => s.scopeTapNodeId);
  const setScopeTapNodeId = usePatchStore((s) => s.setScopeTapNodeId);
  const isRunning = usePatchStore((s) => s.isRunning);

  const candidates = listScopeTapCandidates(nodes);
  const defaultId = resolveDefaultScopeTapId(nodes);
  const activeId = scopeTapNodeId ?? defaultId;

  if (candidates.length === 0) return null;

  return (
    <div className="mb-4 border-2 border-module-border bg-module-fill p-2">
      <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-secondary">
        scope tap
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-[9px] text-secondary">
          {isRunning ? "Monitoring selected node" : "Select tap · Run to view"}
        </span>
        <select
          value={activeId ?? ""}
          onChange={(e) => setScopeTapNodeId(e.target.value || null)}
          className="nodrag nopan border-2 border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-primary outline-none focus:border-cold"
        >
          {candidates.map((c) => {
            const code = getModuleTheme(c.kind).code;
            return (
              <option key={c.id} value={c.id}>
                {code} · {c.label}
              </option>
            );
          })}
        </select>
      </label>
      <p className="mt-2 text-[8px] leading-snug text-secondary/80">
        Click a module on the canvas to switch tap. Scopes follow this point in
        the signal flow.
      </p>
    </div>
  );
}
