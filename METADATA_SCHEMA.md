# METADATA_SCHEMA.md — Synthesis Learning Lab

> The hybrid metadata system. **YAML frontmatter** lives in each experiment's `experiment.md`
> (human-readable, clean docs). **`metadata.json`** holds machine-readable backend tags that
> agents consume. Build both per experiment. Validate `metadata.json` with Zod.

---

## 1. YAML frontmatter (in `experiment.md`)

Human-facing, readable, lives at the top of the experiment's markdown doc.

```yaml
---
title: "Oscillator Basics"
description: "Generate raw tones and see their frequency content in real time."
slug: "01-oscillator"
order: 1

# Learning-facing
learningObjectives:
  - "Identify the four core waveforms by sight and sound"
  - "Relate frequency to perceived pitch"
  - "Read an FFT display to see harmonic content"
prerequisites: []            # slugs of required prior experiments
difficulty: 1                # 1–5
estimatedMinutes: 8
concepts:                    # human-readable concept tags
  - oscillator
  - waveform
  - frequency
  - amplitude
  - fft

# Provenance / housekeeping (useful, not necessarily front-end-exposed)
author: "Hartley LeRoy"
version: "0.1.0"
changelog:
  - "0.1.0 — initial draft"
compatibility:
  requiresAudioPlayback: true
  mobileFriendly: true
summary: >                   # agent-facing summary for tutorial generation
  Introduces the oscillator as the fundamental sound source. Learner selects a
  waveform, adjusts frequency and amplitude, and observes the resulting spectrum
  on a live FFT display — establishing the visual vocabulary reused throughout.
---
```

### Field reference (frontmatter)
| Field | Type | Exposed on front end? | Purpose |
|---|---|---|---|
| `title` | string | yes | Display name |
| `description` | string | yes | One-line hook |
| `slug` | string | — | Stable id / route key |
| `order` | number | yes | Position in the arc |
| `learningObjectives` | string[] | yes | What the learner will be able to do |
| `prerequisites` | string[] (slugs) | yes | Gating for learner flow |
| `difficulty` | 1–5 | yes | Filtering / pacing |
| `estimatedMinutes` | number | yes | Sets expectation |
| `concepts` | string[] | yes | Tag-based discovery + graph seeds |
| `author` | string | no | Housekeeping |
| `version` | semver string | no | Tracking |
| `changelog` | string[] | no | History |
| `compatibility` | object | partial | Playback / mobile flags |
| `summary` | string | no (agent-facing) | Source text for tutorial generation |

---

## 2. `metadata.json` (backend tags for agents)

Machine-readable. Mirrors a little of the frontmatter but adds the wiring agents need —
which tools/components/state an experiment uses, how it relates to others, and gating.

```json
{
  "slug": "01-oscillator",
  "version": "0.1.0",

  "audioModules": ["lib/audio/oscillator", "lib/audio/gain"],
  "uiComponents": [
    "lib/viz/FFTDisplay",
    "lib/viz/Spectrograph",
    "lib/ui/WaveformSelector",
    "lib/ui/ParamSlider"
  ],
  "statePatterns": ["audio-context-provider", "param-store"],

  "relatedExperiments": ["02-unison"],
  "prerequisites": [],

  "conceptTags": ["oscillator", "waveform", "frequency", "amplitude", "fft"],
  "difficulty": 1,
  "estimatedCognitiveLoad": "low",

  "gating": {
    "tutorialGeneration": "auto",
    "graphInclusion": "auto",
    "publish": "human-review"
  },

  "changelog": [
    { "version": "0.1.0", "date": "2026-06-15", "note": "initial draft" }
  ]
}
```

### Field reference (`metadata.json`)
| Field | Type | Purpose |
|---|---|---|
| `slug` | string | Match to experiment + frontmatter |
| `version` | semver | Tracking |
| `audioModules` | string[] | Which `lib/audio` utilities it uses → reuse detection |
| `uiComponents` | string[] | Which components it references → progressive-disclosure mapping |
| `statePatterns` | string[] | How it manages state → consistency across experiments |
| `relatedExperiments` | string[] (slugs) | Cross-links for the graph |
| `prerequisites` | string[] (slugs) | Dependency edges |
| `conceptTags` | string[] | Backend concept tags (may differ from learner-facing `concepts`) |
| `difficulty` | 1–5 | Filtering |
| `estimatedCognitiveLoad` | "low" \| "medium" \| "high" | Pacing heuristic for tutorial gen |
| `gating.tutorialGeneration` | "auto" \| "human-review" | Can agents auto-write lessons? |
| `gating.graphInclusion` | "auto" \| "human-review" | Auto-add to the graph? |
| `gating.publish` | "auto" \| "human-review" | Auto-publish or hold for approval? |
| `changelog` | object[] | Versioned history |

---

## 3. Zod schema for `metadata.json`

Define in `lib/schemas/metadata.ts`. All `metadata.json` files must validate against this.

```ts
import { z } from "zod";

export const Gating = z.enum(["auto", "human-review"]);

export const ExperimentMetadata = z.object({
  slug: z.string(),
  version: z.string(),

  audioModules: z.array(z.string()),
  uiComponents: z.array(z.string()),
  statePatterns: z.array(z.string()),

  relatedExperiments: z.array(z.string()),
  prerequisites: z.array(z.string()),

  conceptTags: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
  estimatedCognitiveLoad: z.enum(["low", "medium", "high"]),

  gating: z.object({
    tutorialGeneration: Gating,
    graphInclusion: Gating,
    publish: Gating,
  }),

  changelog: z.array(
    z.object({
      version: z.string(),
      date: z.string(),
      note: z.string(),
    })
  ),
});

export type ExperimentMetadata = z.infer<typeof ExperimentMetadata>;
```

---

## 4. Why hybrid (the trade-off, recorded)

- **YAML frontmatter** keeps docs clean and human-readable; great for the learning-facing fields
  and lives right next to the prose.
- **`metadata.json`** gives agents rigid, parseable structure for tooling/automation without
  cluttering the readable doc.
- The deterministic graph pass reads **both**; the readable layer stays pleasant, the machine
  layer stays strict.
