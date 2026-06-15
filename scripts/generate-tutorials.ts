import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { scanAllExperiments } from "../graph/extract/deterministic";
import { TutorialChunk } from "../lib/schemas/tutorial";
import { ExperimentMetadata } from "../lib/schemas/metadata";

const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "graph/tutorials");

function main() {
  const scans = scanAllExperiments(ROOT);
  const chunks: ReturnType<typeof TutorialChunk.parse>[] = [];

  for (const scan of scans) {
    const meta = ExperimentMetadata.parse(scan.metadata);
    if (meta.gating.tutorialGeneration !== "auto") continue;

    for (const objective of scan.frontmatter.learningObjectives) {
      const chunk = TutorialChunk.parse({
        id: `${scan.slug}-${objective.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
        experimentId: scan.slug,
        concept: scan.frontmatter.concepts[0] ?? scan.slug,
        title: objective,
        body: `${objective}. ${scan.frontmatter.summary ?? scan.frontmatter.description}`,
        estimatedMinutes: Math.max(
          2,
          Math.round(scan.frontmatter.estimatedMinutes / scan.frontmatter.learningObjectives.length)
        ),
        prerequisites: scan.frontmatter.prerequisites,
        gate: meta.gating.publish,
      });
      chunks.push(chunk);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, "chunks.json");
  writeFileSync(outPath, JSON.stringify(chunks, null, 2));
  console.log(`[tutorials] Generated ${chunks.length} chunks → ${outPath}`);
}

main();
