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

## Non-Negotiable Rules

1. **Every step of the Interview below is REQUIRED — none may be skipped**, the dependency review included. Where other skills describe the Dependencies subsection as something a project may not have yet, that describes its *presence before onboarding* — producing it is mandatory here.
2. **Purposes and layer assignments are developer-provided facts.** You cannot know why a dependency is present — only the developer can. A value you inferred is a **proposal**: label it `(proposed — confirm)`, never present it as fact.
3. **If you have not asked, you do not have an answer.** Never fill in a purpose, layer, manager, or prefix the developer has not confirmed — the sole exception is the framework prefixes auto-recorded from the confirmed tier-1 mapping.
4. **The write is gated on sign-off.** The context file is written only after the developer approves the complete rendered `## AEP Conventions` section, with every dependency row present and no unconfirmed values remaining.

## The Interview

1. **Check existing state.** If a complete `## AEP Conventions` section exists, offer a review/refresh instead of a fresh interview. Compare each Dependencies version snapshot against `sfdx-project.json`; report any drift.
2. **Project prefix.** Infer a candidate by scanning the default package directory (from `sfdx-project.json`) for prefixed classes/objects, offer it for confirmation, and ask if nothing can be inferred.
3. **Dependency review.** Read the `dependencies` (and `packageAliases`) from `sfdx-project.json`. Present **ALL** of them to the developer as a review table — name | layer | purpose | prefix | version — with every cell you inferred labeled `(proposed — confirm)` and every cell you cannot infer left visibly blank. Ask the developer to confirm or correct **each row**; do not proceed to step 4 while any row remains unconfirmed. The fields, per dependency:
   - **Purpose** — one line, in their words: why is this dependency present?
   - **Layer** — place it in the ecosystem taxonomy (offer an inferred guess where the name or purpose makes it obvious): **Framework / Universal Common / Org-wide Common / Project Common / Business / Third-Party Extension / Third-Party Managed / Integration**. (A Single-Org ecosystem simply has no Universal Common tier.)
   - **Prefix** — the package's class prefix; for Third-Party Managed packages, the namespace instead. For Third-Party Extension packages, also record **which managed namespace's AEP layers the extension owns** (e.g., "AEP layers for DocuSign (`dsfs__`) objects") — this mapping is not derivable from names and is required for ownership resolution of namespaced objects.
   - **Bundled-coverage mapping** — confirm with the developer which entries correspond to the four packages this plugin bundles tier-1 references for: **fflib-apex-common, fflib-apex-mocks, force-di, at4dx**. Dependency names may differ (shops often consume these as renamed private clones — e.g., `acme-fflib-common`), so the mapping is asked, never assumed from names. A developer whose clone has **meaningfully diverged** from upstream may decline the mapping — their fork is then treated as uncovered and gets an inventory instead of subtly-wrong bundled references.
   - **Framework prefixes are auto-recorded, never asked.** Once an entry is mapped to one of the four frameworks, record its known prefix without asking the developer: `fflib-apex-common` → **fflib**; `fflib-apex-mocks` → **fflib**; `force-di` → **di**; `at4dx` → **no prefix**.
   - **Version snapshot** — copy the version string from `sfdx-project.json` **verbatim** (e.g., `1.4.0.LATEST`); do not resolve or normalize it.
4. **Standard-SObjects manager.** Usually identified during the review ("which of these manages the standard objects?"); ask explicitly if not. Value may be a package prefix, `this project`, or a split mapping (e.g., `User, Task: CMN; Product2: PRICING`).
5. **Write the section** (format below) into the current platform's project context file — the file this session auto-loaded (e.g., `CLAUDE.md` for Claude Code, `GEMINI.md` for Gemini CLI) — creating it if absent, and only after the developer approves the complete rendered section (Non-Negotiable Rule 4). Teams use one platform per project; write only the current platform's file.
6. **Generate package inventories** (see below), then suggest committing the context file and `aep-references/` together.

## The AEP Conventions format

```markdown
## AEP Conventions

- Project prefix: ACME
- Standard SObjects are managed by: CMN (common-core package)
- Dependencies:
  - Framework:
    - acme-fflib-common (fflib) @ 5.1.0: private clone of fflib-apex-common — covered by bundled tier-1 references
    - force-di (di) @ 1.0.0: dependency injection framework — covered by bundled tier-1 references
    - at4dx (no prefix) @ 1.2.0: AEP framework — covered by bundled tier-1 references
    - acme-promises (PRM) @ 2.0.0: async promise library — inventoried
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

Generate a committed name inventory for **every dependency EXCEPT those the developer mapped to the plugin's bundled tier-1 references** during the review. Coverage is decided by that confirmed mapping — never by layer placement (a Framework-layer library that is not one of the four bundled AEP frameworks absolutely gets an inventory) and never by name matching alone. One limitation: inventory generation needs a membership marker (prefix or namespace); for an unmarked package, record its purpose line and note that no inventory is possible — strict prefix naming is the only membership signal available.

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
