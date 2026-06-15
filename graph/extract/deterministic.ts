import { createHash } from "crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { ExperimentMetadata } from "@/lib/schemas/metadata";
import { GraphEdge, GraphNode, KnowledgeGraph } from "@/lib/schemas/graph";
import { ExperimentFrontmatter } from "@/lib/schemas/frontmatter";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;
const SOURCE_CITATION_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const CONCEPT_LINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MD_LINK_RE = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

export type ExperimentScan = {
  slug: string;
  dir: string;
  frontmatter: ExperimentFrontmatter;
  metadata: ExperimentMetadata;
  sources: string[];
  docFiles: string[];
};

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) {
      i++;
      continue;
    }

    if (!/^[a-zA-Z]/.test(lines[i])) {
      i++;
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = trimmed.slice(0, colonIdx).trim();
    const val = trimmed.slice(colonIdx + 1).trim();

    if (val === "[]") {
      result[key] = [];
      i++;
      continue;
    }

    if (val !== "" && val !== ">") {
      result[key] = val.replace(/^["']|["']$/g, "");
      i++;
      continue;
    }

    i++;
    const listItems: string[] = [];
    const nested: Record<string, unknown> = {};
    const blockLines: string[] = [];

    while (i < lines.length) {
      const line = lines[i];
      if (/^[a-zA-Z][\w-]*:/.test(line)) break;

      const t = line.trim();
      if (t.startsWith("- ")) {
        listItems.push(t.slice(2).trim().replace(/^["']|["']$/g, ""));
      } else if (/^[\w]+:/.test(t)) {
        const subColon = t.indexOf(":");
        const subKey = t.slice(0, subColon).trim();
        const subVal = t.slice(subColon + 1).trim();
        nested[subKey] =
          subVal === "true" ? true : subVal === "false" ? false : subVal;
      } else if (t) {
        blockLines.push(t);
      }
      i++;
    }

    if (listItems.length > 0) {
      result[key] = listItems;
    } else if (Object.keys(nested).length > 0) {
      result[key] = nested;
    } else if (blockLines.length > 0) {
      result[key] = blockLines.join(" ");
    } else {
      result[key] = [];
    }
  }

  return result;
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value === "[]" || value === "" || value === undefined) return [];
  return [String(value)];
}

function coerceCompatibility(
  value: unknown
): { requiresAudioPlayback?: boolean; mobileFriendly?: boolean } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const obj = value as Record<string, unknown>;
  return {
    requiresAudioPlayback:
      obj.requiresAudioPlayback === true || obj.requiresAudioPlayback === "true",
    mobileFriendly:
      obj.mobileFriendly === true || obj.mobileFriendly === "true",
  };
}

export function extractFrontmatter(text: string): Record<string, unknown> {
  const match = FRONTMATTER_RE.exec(text);
  if (!match) return {};
  return parseSimpleYaml(match[1]);
}

export function extractSourceCitations(sourcesMd: string): string[] {
  const citations: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = SOURCE_CITATION_RE.exec(sourcesMd)) !== null) {
    citations.push(`${m[1]} — ${m[2]}`);
  }
  return citations;
}

export function fingerprintExperiments(root: string): string {
  const hash = createHash("sha256");
  const experimentsDir = join(root, "app/experiments");
  if (!existsSync(experimentsDir)) return hash.digest("hex");

  const slugs = readdirSync(experimentsDir).sort();
  for (const slug of slugs) {
    const expDir = join(experimentsDir, slug);
    if (!statSync(expDir).isDirectory()) continue;
    for (const file of ["experiment.md", "metadata.json"]) {
      const path = join(expDir, file);
      if (existsSync(path)) {
        hash.update(readFileSync(path));
      }
    }
    const docsDir = join(expDir, "docs");
    if (existsSync(docsDir)) {
      for (const doc of readdirSync(docsDir).sort()) {
        hash.update(readFileSync(join(docsDir, doc)));
      }
    }
  }
  return hash.digest("hex");
}

export function scanExperiment(expDir: string, slug: string): ExperimentScan {
  const experimentMd = readFileSync(join(expDir, "experiment.md"), "utf-8");
  const metadataRaw = JSON.parse(
    readFileSync(join(expDir, "metadata.json"), "utf-8")
  );

  const fmRaw = extractFrontmatter(experimentMd);
  const frontmatter = ExperimentFrontmatter.parse({
    ...fmRaw,
    order: Number(fmRaw.order),
    difficulty: Number(fmRaw.difficulty),
    estimatedMinutes: Number(fmRaw.estimatedMinutes),
    learningObjectives: coerceStringArray(fmRaw.learningObjectives),
    prerequisites: coerceStringArray(fmRaw.prerequisites),
    concepts: coerceStringArray(fmRaw.concepts),
    changelog: coerceStringArray(fmRaw.changelog),
    compatibility: coerceCompatibility(fmRaw.compatibility),
    summary:
      typeof fmRaw.summary === "string"
        ? fmRaw.summary
        : Array.isArray(fmRaw.summary)
          ? (fmRaw.summary as string[]).join(" ")
          : undefined,
  });

  const metadata = ExperimentMetadata.parse(metadataRaw);

  const docsDir = join(expDir, "docs");
  const docFiles = existsSync(docsDir)
    ? readdirSync(docsDir).map((f) => join(docsDir, f))
    : [];

  const sourcesPath = join(docsDir, "sources.md");
  const sources = existsSync(sourcesPath)
    ? extractSourceCitations(readFileSync(sourcesPath, "utf-8"))
    : [];

  return { slug, dir: expDir, frontmatter, metadata, sources, docFiles };
}

export function buildDeterministicGraph(
  scans: ExperimentScan[],
  root: string
): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  const addNode = (node: GraphNode) => {
    if (!nodeIds.has(node.id)) {
      nodeIds.add(node.id);
      nodes.push(node);
    }
  };

  const addEdge = (edge: GraphEdge) => {
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) {
      edges.push(edge);
    }
  };

  for (const scan of scans) {
    const expId = `experiment:${scan.slug}`;
    addNode({
      id: expId,
      label: scan.frontmatter.title,
      type: "experiment",
      summary: scan.frontmatter.summary ?? scan.frontmatter.description,
      experimentIds: [scan.slug],
      sources: [`${scan.slug}/docs/sources.md`],
    });

    for (const concept of scan.frontmatter.concepts) {
      const conceptId = `concept:${concept}`;
      addNode({
        id: conceptId,
        label: concept,
        type: "concept",
        summary: `Concept tag from ${scan.slug}`,
        experimentIds: [scan.slug],
        sources: [`${scan.slug}/experiment.md`],
      });
      addEdge({
        from: expId,
        to: conceptId,
        predicate: "teaches",
        confidence: 1,
        evidence: `${scan.slug}/experiment.md#concepts`,
      });
    }

    for (const prereq of scan.metadata.prerequisites) {
      const prereqId = `experiment:${prereq}`;
      addEdge({
        from: prereqId,
        to: expId,
        predicate: "prerequisite-of",
        confidence: 1,
        evidence: `${scan.slug}/metadata.json#prerequisites`,
      });
    }

    for (const related of scan.metadata.relatedExperiments) {
      addEdge({
        from: expId,
        to: `experiment:${related}`,
        predicate: "related-to",
        confidence: 1,
        evidence: `${scan.slug}/metadata.json#relatedExperiments`,
      });
    }

    for (const mod of scan.metadata.audioModules) {
      const compId = `component:${mod.replace(/\//g, "-")}`;
      addNode({
        id: compId,
        label: mod,
        type: "component",
        summary: `Audio/UI module used by ${scan.slug}`,
        experimentIds: [scan.slug],
        sources: [`${scan.slug}/metadata.json#audioModules`],
      });
      addEdge({
        from: expId,
        to: compId,
        predicate: "uses",
        confidence: 1,
        evidence: `${scan.slug}/metadata.json#audioModules`,
      });
    }

    for (const ui of scan.metadata.uiComponents) {
      const compId = `component:${ui.replace(/\//g, "-")}`;
      addNode({
        id: compId,
        label: ui,
        type: "component",
        summary: `UI component used by ${scan.slug}`,
        experimentIds: [scan.slug],
        sources: [`${scan.slug}/metadata.json#uiComponents`],
      });
      addEdge({
        from: expId,
        to: compId,
        predicate: "uses",
        confidence: 1,
        evidence: `${scan.slug}/metadata.json#uiComponents`,
      });
    }

    scan.sources.forEach((citation, i) => {
      const sourceId = `source:${scan.slug}-${i}`;
      addNode({
        id: sourceId,
        label: citation.split(" — ")[0] ?? citation,
        type: "source",
        summary: citation,
        experimentIds: [scan.slug],
        sources: [`${scan.slug}/docs/sources.md`],
      });
      addEdge({
        from: expId,
        to: sourceId,
        predicate: "cites",
        confidence: 1,
        evidence: `${scan.slug}/docs/sources.md`,
      });
    });

    const theoryPath = join(scan.dir, "docs/theory.md");
    if (existsSync(theoryPath)) {
      const theory = readFileSync(theoryPath, "utf-8");
      let m: RegExpExecArray | null;
      while ((m = CONCEPT_LINK_RE.exec(theory)) !== null) {
        const target = m[1].trim();
        addEdge({
          from: expId,
          to: `concept:${target}`,
          predicate: "references",
          confidence: 0.9,
          evidence: `${scan.slug}/docs/theory.md`,
        });
      }
      CONCEPT_LINK_RE.lastIndex = 0;
      while ((m = MD_LINK_RE.exec(theory)) !== null) {
        const target = m[2].replace(/\.md$/, "");
        if (target.startsWith("../")) {
          const relatedSlug = target.replace("../", "").split("/")[0];
          addEdge({
            from: expId,
            to: `experiment:${relatedSlug}`,
            predicate: "references",
            confidence: 0.9,
            evidence: `${scan.slug}/docs/theory.md`,
          });
        }
      }
    }
  }

  const fingerprint = fingerprintExperiments(root);

  return KnowledgeGraph.parse({
    version: "0.1.0",
    generatedAt: new Date().toISOString(),
    fingerprint,
    nodes,
    edges,
    stats: {
      experiments: scans.length,
      concepts: nodes.filter((n) => n.type === "concept").length,
      sources: nodes.filter((n) => n.type === "source").length,
      edges: edges.length,
      deterministic: edges.length,
      llm: 0,
    },
  });
}

export function scanAllExperiments(root: string): ExperimentScan[] {
  const experimentsDir = join(root, "app/experiments");
  if (!existsSync(experimentsDir)) return [];

  return readdirSync(experimentsDir)
    .filter((name) => statSync(join(experimentsDir, name)).isDirectory())
    .sort()
    .map((slug) => scanExperiment(join(experimentsDir, slug), slug));
}

export function loadGraphIndex(root: string): string | null {
  const indexPath = join(root, "graph/index.md");
  return existsSync(indexPath) ? readFileSync(indexPath, "utf-8") : null;
}

export function relativeExperimentPath(root: string, expDir: string): string {
  return relative(root, expDir);
}
