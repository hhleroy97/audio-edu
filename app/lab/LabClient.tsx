"use client";

import dynamic from "next/dynamic";

const PatchLab = dynamic(() => import("./PatchLab").then((m) => m.PatchLab), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-screen flex-col bg-base"
      aria-busy="true"
      aria-label="Loading patch lab"
    >
      <header className="patch-lab-header flex items-center justify-between px-4 py-3">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-module-header" />
          <div className="h-5 w-48 bg-module-header" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center border-t-2 border-module-border">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Loading patch lab…
        </p>
      </div>
    </div>
  ),
});

/** Client-only shell — React Flow + browser extensions break SSR hydration. */
export function LabClient() {
  return <PatchLab />;
}
