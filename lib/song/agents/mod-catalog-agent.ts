import type { SectionDefType } from "@/lib/schemas/song";
import type { ModCatalogDefType } from "@/lib/schemas/mod-catalog";
import type {
  ArrangementRulePackType,
  RulePackSectionSpecType,
} from "@/lib/schemas/rule-pack";
import { expandModProfile, listModProfiles } from "../riddim/mod-schemas";
import { createSeededRng } from "../pattern/tonal-notes";
import { DEFAULT_MOD_FX } from "./modfx-agent";

export type ModCatalogAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
  seed: string;
  layerIds: Set<string>;
};

export type ModCatalogAgentResult = {
  sections: SectionDefType[];
};

function pickFromPool(
  pool: string[],
  seed: string,
  sectionId: string,
  rotate: boolean
): string {
  if (pool.length === 1) return pool[0]!;
  if (!rotate) return pool[0]!;
  const rng = createSeededRng(`${seed}:mod:${sectionId}`);
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]!;
}

/** Resolve body mod profile: explicit spec → modFx kind → catalog pool. */
export function resolveBodyModProfile(
  pack: ArrangementRulePackType,
  spec: RulePackSectionSpecType,
  seed: string
): string | undefined {
  if (spec.modProfileId) return spec.modProfileId;

  const modFxSpec =
    pack.modFx?.bySectionKind?.[spec.kind] ??
    DEFAULT_MOD_FX.bySectionKind?.[spec.kind];
  if (modFxSpec?.bodyModProfileId) return modFxSpec.bodyModProfileId;

  const catalog: ModCatalogDefType | undefined = pack.modCatalog;
  const pool = catalog?.bodyBySectionKind?.[spec.kind];
  if (pool?.length) {
    return pickFromPool(
      pool,
      seed,
      spec.id,
      catalog?.rotateWithSeed ?? true
    );
  }

  return undefined;
}

/** Resolve top mod profile: explicit spec → modFx kind → catalog pool. */
export function resolveTopModProfile(
  pack: ArrangementRulePackType,
  spec: RulePackSectionSpecType,
  seed: string
): string | undefined {
  if (spec.topModProfileId) return spec.topModProfileId;

  const modFxSpec =
    pack.modFx?.bySectionKind?.[spec.kind] ??
    DEFAULT_MOD_FX.bySectionKind?.[spec.kind];
  if (modFxSpec?.topModProfileId) return modFxSpec.topModProfileId;

  const catalog: ModCatalogDefType | undefined = pack.modCatalog;
  const pool = catalog?.topBySectionKind?.[spec.kind];
  if (pool?.length) {
    return pickFromPool(
      pool,
      seed,
      `${spec.id}:top`,
      catalog?.rotateWithSeed ?? true
    );
  }

  return undefined;
}

/** Expand catalog-resolved mod profiles into section automation (#110). */
export function runModCatalogAgent(
  input: ModCatalogAgentInput
): ModCatalogAgentResult {
  const { pack, seed, layerIds } = input;

  const sections = input.sections.map((section) => {
    const spec = pack.sections.find((s) => s.id === section.id);
    if (!spec) return section;

    const extraEvents = [...section.events];
    const bodyProfile = resolveBodyModProfile(pack, spec, seed);
    const topProfile = resolveTopModProfile(pack, spec, seed);

    if (bodyProfile && layerIds.has("body")) {
      extraEvents.push(...expandModProfile(bodyProfile, "body"));
    }
    if (topProfile && layerIds.has("top")) {
      extraEvents.push(...expandModProfile(topProfile, "top"));
    }

    return { ...section, events: extraEvents };
  });

  return { sections };
}

export function lintModCatalogAgent(result: ModCatalogAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const section of result.sections) {
    for (const ev of section.events) {
      if (ev.kind === "automation" && !ev.nodeId) {
        errors.push(`mod catalog automation missing nodeId in ${section.id}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export function countUniqueModProfiles(
  pack: ArrangementRulePackType,
  seed: string
): number {
  const used = new Set<string>();
  for (const spec of pack.sections) {
    const body = resolveBodyModProfile(pack, spec, seed);
    const top = resolveTopModProfile(pack, spec, seed);
    if (body) used.add(body);
    if (top) used.add(top);
  }
  return used.size;
}

export function catalogCoversProfiles(minCount: number): boolean {
  return listModProfiles().length >= minCount;
}
