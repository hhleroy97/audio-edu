import { describe, expect, it } from "vitest";
import {
  ARRANGEMENT_RULE_PACK_LIST,
  catalogCoversProfiles,
  countUniqueModProfiles,
  resolveBodyModProfile,
  runArrangement,
  runModCatalogAgent,
} from "@/lib/song/agents";
import {
  RIDDIM_INFEKT_16,
  RIDDIM_TEAROUT_16,
  RIDDIM_YOI_16,
} from "@/lib/song/agents/rule-packs";
import { listModProfiles } from "@/lib/song/riddim/mod-schemas";
import { runEvaluationAgent } from "@/lib/song/agents/evaluation-agent";

describe("Mod catalog (#110)", () => {
  it("defines at least 7 mod profiles in catalog", () => {
    expect(catalogCoversProfiles(7)).toBe(true);
    expect(listModProfiles().length).toBeGreaterThanOrEqual(9);
  });

  it("resolves yoi build profile from mod catalog pool", () => {
    const build = RIDDIM_YOI_16.sections.find((s) => s.id === "build")!;
    expect(resolveBodyModProfile(RIDDIM_YOI_16, build, "yoi-test")).toBe(
      "dsf-allpass-comb-swell"
    );
  });

  it("rotates tearout drop profiles by seed when not explicit", () => {
    const breakSpec = RIDDIM_TEAROUT_16.sections.find((s) => s.id === "break")!;
    expect(resolveBodyModProfile(RIDDIM_TEAROUT_16, breakSpec, "x")).toBeUndefined();

    const dropA = RIDDIM_TEAROUT_16.sections.find((s) => s.id === "drop-a")!;
    expect(resolveBodyModProfile(RIDDIM_TEAROUT_16, dropA, "tearout")).toBe(
      "tearout-index-spike"
    );
  });

  it("exercises multiple mod profiles across archetype packs", () => {
    const profiles = new Set<string>();
    for (const pack of [RIDDIM_YOI_16, RIDDIM_TEAROUT_16, RIDDIM_INFEKT_16]) {
      for (const spec of pack.sections) {
        const body = resolveBodyModProfile(pack, spec, "catalog-scan");
        if (body) profiles.add(body);
      }
    }
    expect(profiles.size).toBeGreaterThanOrEqual(6);
  });

  it("generates valid arrangements for new rule packs", () => {
    for (const pack of [RIDDIM_YOI_16, RIDDIM_TEAROUT_16, RIDDIM_INFEKT_16]) {
      const run = runArrangement({ rulePackId: pack.id, seed: `pack-${pack.id}` });
      const report = runEvaluationAgent(run.song, pack);
      expect(report.ok, report.errors.join("; ")).toBe(true);
      expect(report.metrics.uniqueBodyPresets).toBeGreaterThanOrEqual(2);
      expect(report.metrics.modKeyframeCount).toBeGreaterThanOrEqual(4);
    }
  });

  it("lists five rule packs total", () => {
    expect(ARRANGEMENT_RULE_PACK_LIST.length).toBe(5);
    expect(countUniqueModProfiles(RIDDIM_INFEKT_16, "infekt")).toBeGreaterThanOrEqual(
      2
    );
  });

  it("runModCatalogAgent expands automation events", () => {
    const sections = RIDDIM_YOI_16.sections.map((s) => ({
      ...s,
      events: [],
    }));
    const layerIds = new Set(["sub", "body", "top"]);
    const result = runModCatalogAgent({
      pack: RIDDIM_YOI_16,
      sections,
      seed: "mod-catalog-unit",
      layerIds,
    });
    const build = result.sections.find((s) => s.id === "build");
    const auto = build?.events.filter((e) => e.kind === "automation") ?? [];
    expect(auto.length).toBeGreaterThanOrEqual(4);
  });
});
