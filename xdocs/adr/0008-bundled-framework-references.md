# 0008. Bundled framework references, generated from a build-time scratch org

- **Status:** Accepted
- **Date:** 2026-08-30
- **Deciders:** @ImJohnMDaniel

## Context

The skills need API-level knowledge of the four AEP frameworks (fflib-apex-mocks, fflib-apex-common, force-di, at4dx). The draft acquired it by mandating runtime org fetches (`learn-org-symbol-table`) of 15–20 framework classes per skill — costing a connected org, round-trip time, and tokens on every fresh project, to learn facts that are static per framework commit. Issue #20 proposed generating reference docs at build time instead; the design was debated and decided 2026-08-30.

## Decision

**Runtime resolution order** for API knowledge: (1) bundled references for framework classes and framework-owned `__mdt` schemas; (2) project source for local classes; (3) org fetch for everything org-specific — dependency-package classes (the 2GP multi-dependency scenario stays first-class), project SObject describes, and fallback verification when a bundled reference disagrees with the org (per ADR-0007: observed facts beat factual claims; report drift).

Design decisions:

1. **Generation mechanics — build-time scratch org.** The build deploys the four frameworks in dependency order (fflib-apex-mocks → fflib-apex-common → force-di → at4dx) to a disposable scratch org and extracts compiler-generated SymbolTables via the Tooling API. A successful deploy doubles as verification that the four pinned commits compile together. Runs **locally, using the local sibling clones**, manually as needed; CI is a later concern.
2. **Format — curated markdown per class:** signature, extension points, public/protected methods with parameter and return types, inner types, relevant ApexDoc. Token-efficient by design.
3. **Scope — the classes the SKILL.md files already enumerate** (the "Ensure Exact Understanding" lists plus framework-owned custom metadata schemas). The list grows as new skills name their classes.
4. **Provenance — git commit hashes, not version numbers.** The AEP repos publish no packages and have no version concept beyond commits (deliberately, so shops can version private clones on their own scheme). Each generated file/folder carries source repo URL + commit hash + generation date. Pinned hashes live in `build/framework-sources.json`; bumping a hash is the deliberate, reviewable act that regenerates references.
5. **Layout — subfolder per framework** (`references/<framework-name>/<ClassName>.md`), **duplicated at build time into each consuming skill's `references/`** — self-containment over dryness.
6. **Scratch org shape:** `build/reference-build-scratch-def.json`, combined from the four repos' own `config/` definitions — Developer edition, Lightning desktop enabled (common to all four), twelve-hour session timeout (from force-di, useful for build sessions). The MultiCurrency variant (fflib-apex-common) is excluded: reference generation does not need it, as the frameworks' own default definitions prove.

## Consequences

- The SKILL.md "learn these framework classes first" preambles become "read `references/…`" — skills get faster and usable before any org is connected.
- `learn-org-symbol-table` / `learn-org-metadata` are demoted to their true purpose: org-specific discovery (dependency packages, project schema) and drift verification.
- The build script (issue #20) needs a Dev Hub locally; framework API changes become visible as reference diffs at regeneration time.
- A shop on a diverged private clone sees exactly which upstream commits the references were cut from and relies on the drift rule for its delta.
