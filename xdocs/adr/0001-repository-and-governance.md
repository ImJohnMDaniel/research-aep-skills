# 0001. Repository and governance

- **Status:** Accepted
- **Date:** 2026-08-29
- **Deciders:** @ImJohnMDaniel

## Context

The project builds a series of Apex Enterprise Patterns skills and related scripts, deployable as both a Claude Code plugin and a Gemini CLI extension. The four AEP framework repositories (fflib-apex-common, fflib-apex-mocks, force-di, at4dx) are available locally as read-only reference material; the question is where this project's own work lives and under whose flag.

## Decision

1. All work is confined to the `research-aep-skills` repository. The framework repositories are never modified by this effort; they serve as ground-truth reference source only.
2. Active development happens on the `experimental-claude` branch.
3. The repository remains under the personal `ImJohnMDaniel` account for now. As the project matures it will transfer to the `github.com/apex-enterprise-patterns` organization and become a "blessed companion" to the frameworks.
4. Artifacts must therefore be transfer-portable: decisions in `xdocs/adr/` (travel with git), backlog in GitHub Issues and design debates in GitHub Discussions (both transfer with the repository). GitHub Projects boards, which do not transfer, are optional and disposable.

## Consequences

- The eventual org transfer is cheap: everything of record moves with the repo.
- "Blessed companion" status raises the bar on content: framework-canonical guidance must be separable from any single project's house style (debate open in Discussion #26).
- Licensing should align with the frameworks (BSD-3-Clause) before publication.
