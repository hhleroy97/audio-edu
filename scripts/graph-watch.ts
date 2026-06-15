import { watch } from "fs";
import { join } from "path";
import { spawn } from "child_process";

const ROOT = join(__dirname, "..");
const EXPERIMENTS = join(ROOT, "app/experiments");
const GRAPH_INDEX = join(ROOT, "graph/index.md");

let timer: ReturnType<typeof setTimeout> | null = null;

function runExtract() {
  console.log("[graph:watch] Changes detected — extracting…");
  const child = spawn("npm", ["run", "graph:extract"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  child.on("close", (code) => {
    if (code === 0) {
      spawn("npm", ["run", "tutorials:generate"], {
        cwd: ROOT,
        stdio: "inherit",
        shell: true,
      });
    }
  });
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(runExtract, 500);
}

console.log("[graph:watch] Watching experiment docs and graph/index.md");
watch(EXPERIMENTS, { recursive: true }, schedule);
watch(GRAPH_INDEX, schedule);
