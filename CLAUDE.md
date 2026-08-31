# AEP Skills — project instructions

Skills and scripts for Salesforce Apex Enterprise Patterns (fflib-apex-common, fflib-apex-mocks, force-di, at4dx), targeting dual deployment as a Claude Code plugin and a Gemini CLI extension.

## Hard constraints

- All work stays in THIS repository, on the `experimental-claude` branch. The four framework repos checked out as siblings under `/Users/john/workspace/_aep/` are read-only reference material — never modify them.
- `main` is the default branch and install target for both platforms; it is fast-forwarded from `experimental-claude` only at stable checkpoints (states a stranger could safely install). Never commit directly to `main`.
- The skill core must stay platform-neutral (see `xdocs/adr/0002`): no `.gemini`/`GEMINI.md`/Claude-specific paths in skill text or bundled scripts, no platform env-var checks, scripts zero-install (plain Node + `sf` CLI).
- `EEORA`, `sfdx-source/eeora/...`, and `UCMN`/`universal-common` references in the draft are project-specific residue being removed (issue #19). Do not propagate them into new content. The project-prefix *concept* is canon; specific values are configuration.

## Work tracking (see xdocs/adr/0003)

- Backlog of record: GitHub Issues on this repo. Design debates: GitHub Discussions. Decisions: `xdocs/adr/`.
- Do not add backlog items to markdown files; file issues instead.
- ALL documentation artifacts in the repo live under `xdocs/` (there is no top-level `docs/` folder).

## Context

- The repo owner is @ImJohnMDaniel, co-author of the AEP frameworks — the authority on framework canon vs. house style.
- Eventual home: github.com/apex-enterprise-patterns (keep artifacts transfer-portable).
- Skills follow the SKILL.md format under `skills/<skill-name>/` with `scripts/`, `assets/` (templates), and `references/` subfolders.
