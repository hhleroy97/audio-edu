import { readFileSync, existsSync } from "fs";
import { join } from "path";
import Link from "next/link";
import { AgentStateIndicator } from "@/lib/ui";

const GRAPH_PATH = join(process.cwd(), "graph/.understand/knowledge-graph.json");

export default function GraphPage() {
  let graph: {
    stats: Record<string, number>;
    nodes: { id: string; label: string; type: string; summary: string }[];
    edges: { from: string; to: string; predicate: string; confidence: number }[];
    generatedAt?: string;
    fingerprint?: string;
  } | null = null;

  if (existsSync(GRAPH_PATH)) {
    graph = JSON.parse(readFileSync(GRAPH_PATH, "utf-8"));
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/"
        className="mb-6 inline-block font-mono text-xs uppercase tracking-widest text-secondary hover:text-cold"
      >
        ← Lab
      </Link>

      <h1 className="text-2xl font-medium">Knowledge Graph</h1>
      <p className="mt-2 text-sm text-secondary">
        Deterministic extract from experiment docs + metadata. Run{" "}
        <code className="text-cold">npm run graph:extract</code> to refresh.
      </p>

      {!graph ? (
        <div className="mt-8">
          <AgentStateIndicator
            phase="error"
            message="Graph not extracted — run npm run graph:extract"
          />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <AgentStateIndicator
            phase="settled"
            message={`Graph settled · ${graph.stats.edges} edges · fingerprint ${graph.fingerprint?.slice(0, 8)}`}
          />

          <section>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-secondary">
              Stats
            </h2>
            <dl className="grid grid-cols-2 gap-4 font-mono text-sm md:grid-cols-4">
              {Object.entries(graph.stats).map(([k, v]) => (
                <div key={k} className="border border-border p-3">
                  <dt className="text-secondary">{k}</dt>
                  <dd className="text-cold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-secondary">
              Nodes ({graph.nodes.length})
            </h2>
            <ul className="space-y-2">
              {graph.nodes.map((n) => (
                <li
                  key={n.id}
                  className="border border-border p-3 text-sm"
                >
                  <span className="font-mono text-xs text-cold">{n.type}</span>
                  <p className="font-medium">{n.label}</p>
                  <p className="text-secondary">{n.summary}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-secondary">
              Edges ({graph.edges.length})
            </h2>
            <ul className="space-y-1 font-mono text-xs">
              {graph.edges.map((e, i) => (
                <li key={i} className="text-secondary">
                  <span className="text-primary">{e.from}</span>
                  <span className="text-cold"> —{e.predicate}→ </span>
                  <span className="text-primary">{e.to}</span>
                  <span className="text-secondary"> ({e.confidence})</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
