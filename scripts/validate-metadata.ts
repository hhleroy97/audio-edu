import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { ExperimentMetadata } from "../lib/schemas/metadata";

const ROOT = join(__dirname, "..");
const experimentsDir = join(ROOT, "app/experiments");

let failed = 0;

for (const slug of readdirSync(experimentsDir).sort()) {
  const dir = join(experimentsDir, slug);
  if (!statSync(dir).isDirectory()) continue;

  const metaPath = join(dir, "metadata.json");
  try {
    const raw = JSON.parse(readFileSync(metaPath, "utf-8"));
    const result = ExperimentMetadata.safeParse(raw);
    if (!result.success) {
      console.error(`[validate] ${slug}:`, result.error.flatten());
      failed++;
    } else {
      console.log(`[validate] ${slug}: ok`);
    }
  } catch (err) {
    console.error(`[validate] ${slug}:`, err);
    failed++;
  }
}

if (failed > 0) process.exit(1);
console.log("[validate] All metadata.json files valid.");
