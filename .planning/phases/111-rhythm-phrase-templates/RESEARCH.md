# Phase 111 — RhythmPhraseDef / 4-bar templates (research)

**Status:** Research complete · **Next:** `/gsd-plan-phase 111`  
**Depends on:** Phase 101 (pocket), Phase 109 (samples)  
**Goal:** REMI-z 4-bar phrase boundaries — A/B/C/D drum slots in drops.

---

## Key findings

| Source | Finding | Port |
|--------|---------|------|
| arXiv #128 REMI-z | Drum patterns on **4-bar segments** | `RhythmPhraseDef.phraseLengthBars: 4` |
| arXiv #131 GraphMuGen | Phrase → structure hierarchy | Template slots per section kind |
| Phase 101 | 2-bar A/B only | Extend to 4-bar C/D variants |

---

## Schema

```ts
RhythmPhraseDef = {
  phraseLengthBars: 4,
  templates: Record<SectionKind, string[]>,
}
```

---

## Full spec

See `docs/research/song-depth-phases-106-111.md` § Phase 111.
