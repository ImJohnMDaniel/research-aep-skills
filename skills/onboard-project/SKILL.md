---
name: onboard-project
description: Onboard a Salesforce project for the Apex Enterprise Patterns skills. Runs a guided interview to establish the AEP Conventions section in the project context file (project prefix, standard-SObjects manager, layer-grouped dependency annotations with version snapshots) and generates committed package inventories for dependency packages. Use when setting up AEP in a project, when the AEP Conventions section is missing or incomplete, or when a dependency's version has changed since it was recorded.
---

# Onboard Project (AEP)

This skill establishes the project knowledge every other AEP skill depends on: the `## AEP Conventions` section of the project context file, and committed name inventories of the project's dependency packages. It is a **conversation with the developer** — never guess an answer the interview is designed to obtain.

**Example placeholders:** `ACME` stands for this project's prefix and `CMN` for the package that manages Standard SObjects — always meaning whatever the developer declares, never literal names.

## When to run

- The developer asks to onboard / set up AEP in this project.
- The project context file has no `## AEP Conventions` section, or an incomplete one.
- A version snapshot on a Dependencies line no longer matches the version declared in `sfdx-project.json` (offer a refresh of that package's entry and inventory).

Note: onboarding an org's unpackaged "Happy Soup" repository (the one project that depends on all packages) is not yet supported — if this repo appears to be one, inform the developer and stop.

## The Interview

1. **Check existing state.** If a complete `## AEP Conventions` section exists, offer a review/refresh instead of a fresh interview. Compare each Dependencies version snapshot against `sfdx-project.json`; report any drift.
2. **Project prefix.** Infer a candidate by scanning the default package directory (from `sfdx-project.json`) for prefixed classes/objects, offer it for confirmation, and ask if nothing can be inferred.
3. **Dependency review.** Read the `dependencies` (and `packageAliases`) from `sfdx-project.json`. For each dependency, ask the developer:
   - **Purpose** — one line, in their words: why is this dependency present?
   - **Layer** — place it in the ecosystem taxonomy (offer an inferred guess where the name or purpose makes it obvious): **Framework / Universal Common / Org-wide Common / Project Common / Business / Third-Party Extension / Third-Party Managed / Integration**. (A Single-Org ecosystem simply has no Universal Common tier.)
   - **Prefix** — the package's class prefix; for Third-Party Managed packages, the namespace instead. For Third-Party Extension packages, also record **which managed namespace's AEP layers the extension owns** (e.g., "AEP layers for DocuSign (`dsfs__`) objects") — this mapping is not derivable from names and is required for ownership resolution of namespaced objects.
   - **Version snapshot** — copy the version string from `sfdx-project.json` **verbatim** (e.g., `1.4.0.LATEST`); do not resolve or normalize it.
4. **Standard-SObjects manager.** Usually identified during the review ("which of these manages the standard objects?"); ask explicitly if not. Value may be a package prefix, `this project`, or a split mapping (e.g., `User, Task: CMN; Product2: PRICING`).
5. **Write the section** (format below) into the current platform's project context file — the file this session auto-loaded (e.g., `CLAUDE.md` for Claude Code, `GEMINI.md` for Gemini CLI) — creating it if absent, always with the developer's confirmation of the final text first. Teams use one platform per project; write only the current platform's file.
6. **Generate package inventories** (see below), then suggest committing the context file and `aep-references/` together.

## The AEP Conventions format

```markdown
## AEP Conventions

- Project prefix: ACME
- Standard SObjects are managed by: CMN (common-core package)
- Dependencies:
  - Framework:
    - fflib-apex-common, fflib-apex-mocks, force-di, at4dx (no prefix): AEP framework base
  - Universal Common:
    - universal-common (CMN) @ 1.4.0.LATEST: standard-SObject layers shared across all orgs
  - Project Common:
    - xxx-common (XXX) @ 1.1.0: shared services for the XXX application family
  - Third-Party Extension:
    - docusign-ext (DSX) @ 1.2.0: AEP layers (selectors/domains) for DocuSign (dsfs__) objects
  - Third-Party Managed:
    - DocuSign (dsfs__): e-signature
```

Record **only what is not derivable**: purposes, layer placement, ownership facts, and generation-time version snapshots. Never restate what `sfdx-project.json` already declares as current fact — the snapshot is deliberately historical ("what our recorded knowledge was generated against").

## Package Inventories

For each **non-framework** dependency with a prefix or namespace (the framework packages are covered by the plugin's bundled tier-1 references and get no inventories), generate a committed name inventory:

```bash
node ./scripts/generate_package_inventory.cjs <package-name> <PREFIX> --declared "<version string verbatim>"
node ./scripts/generate_package_inventory.cjs <package-name> <namespace> --namespace --declared "<version string verbatim>"
```

- Output: `aep-references/<package-name>/INVENTORY.md` in the project root (redirect with `--out <dir>`; if the developer chooses a different folder, record the choice in the context file).
- The inventory is **names only**, grouped by layer inferred from naming conventions, with SObject annotations where deducible (e.g., `CMN_UsersSelector (User)`). Existence-awareness is its job; fetch API details on demand via the `learn-org-symbol-table` / `learn-org-metadata` skills.
- Provenance carries both the **declared version snapshot** (drives the refresh check) and the **installed version** from the org at generation time (which build the names actually reflect).
- Membership detection relies on strict prefix naming — the only package-membership signal available in non-namespaced unlocked packages. If a package violates the convention, the inventory is incomplete: accept it and report the gap to the developer.
- These files are **committed to the project repo** (unlike the git-ignored `.aep/cache/`), so agents on any platform read them directly and the whole team shares one onboarding run.

## Refresh

When a Dependencies snapshot no longer matches `sfdx-project.json`: confirm with the developer, re-run the inventory script for that package, update the snapshot on its Dependencies line, and offer to revisit its purpose line. Never silently rewrite the developer's purpose annotations.
