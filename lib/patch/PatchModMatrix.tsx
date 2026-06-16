"use client";

import { listCvModRoutes } from "@/lib/patch/mod-matrix";
import { usePatchStore } from "@/lib/patch/store";

export function PatchModMatrix() {
  const nodes = usePatchStore((s) => s.nodes);
  const edges = usePatchStore((s) => s.edges);
  const updateModDepth = usePatchStore((s) => s.updateModDepth);

  const routes = listCvModRoutes(nodes, edges);

  if (routes.length === 0) {
    return (
      <div className="mb-4 border-2 border-module-border bg-module-fill p-2">
        <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-secondary">
          mod matrix
        </p>
        <p className="mt-2 text-[9px] text-secondary/80">
          Patch CV cables to see routes and depth controls.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 border-2 border-module-border bg-module-fill p-2">
      <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-secondary">
        mod matrix
      </p>
      <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto">
        {routes.map((route) => (
          <li key={route.edgeId} className="text-[9px]">
            <div className="mb-1 flex items-center gap-1 text-secondary">
              <span className="font-bold text-cold">{route.sourceCode}</span>
              <span className="text-hot">{route.sourceHandle}</span>
              <span>→</span>
              <span className="font-bold text-cold">{route.targetCode}</span>
              <span className="text-hot">{route.targetHandle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 text-secondary">depth</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={route.depth}
                onChange={(e) =>
                  updateModDepth(route.edgeId, Number(e.target.value))
                }
                className="nodrag nopan flex-1 accent-hot"
              />
              <span className="w-8 font-mono text-cold">
                {route.depth.toFixed(2)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
