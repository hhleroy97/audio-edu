import { describe, expect, it } from "vitest";
import { join } from "path";
import {
  extractFrontmatter,
  extractSourceCitations,
  scanAllExperiments,
  buildDeterministicGraph,
} from "@/graph/extract/deterministic";
import { mergeResearchSupplements } from "@/graph/extract/research";
import { ExperimentMetadata } from "@/lib/schemas/metadata";

const ROOT = join(__dirname, "..");

describe("metadata validation", () => {
  it("validates all experiment metadata.json files", () => {
    const scans = scanAllExperiments(ROOT);
    expect(scans.length).toBeGreaterThanOrEqual(1);
    for (const scan of scans) {
      expect(() => ExperimentMetadata.parse(scan.metadata)).not.toThrow();
    }
  });
});

describe("deterministic graph extractor", () => {
  it("parses experiment 01 frontmatter", () => {
    const scans = scanAllExperiments(ROOT);
    const exp01 = scans.find((s) => s.slug === "01-oscillator");
    expect(exp01).toBeDefined();
    expect(exp01!.frontmatter.title).toBe("Oscillator Basics");
    expect(exp01!.frontmatter.concepts).toContain("oscillator");
  });

  it("extracts source citations from sources.md", () => {
    const citations = extractSourceCitations(
      "[MDN](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode)"
    );
    expect(citations[0]).toContain("MDN");
    expect(citations[0]).toContain("developer.mozilla.org");
  });

  it("builds a valid knowledge graph", () => {
    const scans = scanAllExperiments(ROOT);
    const graph = buildDeterministicGraph(scans, ROOT);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.stats.deterministic).toBe(graph.stats.edges);
    expect(graph.nodes.some((n) => n.id === "experiment:01-oscillator")).toBe(
      true
    );
  });

  it("merges research supplements into the graph", () => {
    const scans = scanAllExperiments(ROOT);
    const graph = mergeResearchSupplements(
      buildDeterministicGraph(scans, ROOT),
      ROOT
    );
    expect(graph.nodes.some((n) => n.id === "technique:sub-layer")).toBe(true);
    expect(graph.nodes.some((n) => n.id === "concept:riddim")).toBe(true);
    expect(graph.stats.llm).toBeGreaterThan(0);
    expect(
      graph.edges.some(
        (e) =>
          e.from === "experiment:06-layering" &&
          e.to === "technique:layer-stack-three"
      )
    ).toBe(true);
  });

  it("extracts YAML frontmatter keys", () => {
    const fm = extractFrontmatter(`---
title: Test
order: 1
concepts:
  - foo
---
# Body`);
    expect(fm.title).toBe("Test");
    expect(fm.concepts).toEqual(["foo"]);
  });
});
