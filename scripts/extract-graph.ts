import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  buildDeterministicGraph,
  fingerprintExperiments,
  scanAllExperiments,
} from "../graph/extract/deterministic";
import { KnowledgeGraph } from "../lib/schemas/graph";

const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "graph/.understand");
const GRAPH_PATH = join(OUT_DIR, "knowledge-graph.json");
const MANIFEST_PATH = join(OUT_DIR, "intermediate/scan-manifest.json");
const FINGERPRINT_PATH = join(OUT_DIR, "fingerprint.json");

function main() {
  const force = process.argv.includes("--force");
  const currentFingerprint = fingerprintExperiments(ROOT);

  if (!force && existsSync(FINGERPRINT_PATH)) {
    const prev = JSON.parse(readFileSync(FINGERPRINT_PATH, "utf-8"));
    if (prev.fingerprint === currentFingerprint && existsSync(GRAPH_PATH)) {
      console.log("[graph] No changes detected — skipping extract.");
      return;
    }
  }

  const scans = scanAllExperiments(ROOT);
  if (scans.length === 0) {
    console.error("[graph] No experiments found in app/experiments/");
    process.exit(1);
  }

  const graph = buildDeterministicGraph(scans, ROOT);

  mkdirSync(join(OUT_DIR, "intermediate"), { recursive: true });
  writeFileSync(GRAPH_PATH, JSON.stringify(graph, null, 2));
  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        format: "synthesis-lab",
        stats: graph.stats,
        experiments: scans.map((s) => ({
          slug: s.slug,
          concepts: s.frontmatter.concepts,
          sources: s.sources.length,
        })),
      },
      null,
      2
    )
  );
  writeFileSync(
    FINGERPRINT_PATH,
    JSON.stringify(
      { fingerprint: currentFingerprint, updatedAt: new Date().toISOString() },
      null,
      2
    )
  );

  const validated = KnowledgeGraph.parse(graph);
  console.log(
    `[graph] Extracted ${validated.stats.experiments} experiments, ` +
      `${validated.stats.concepts} concepts, ${validated.stats.edges} edges ` +
      `(deterministic). Output: ${GRAPH_PATH}`
  );
}

main();
