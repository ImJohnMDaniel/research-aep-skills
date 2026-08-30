# 0005. Generator scripts never deploy; the agent owns deployment

- **Status:** Accepted
- **Date:** 2026-08-29
- **Deciders:** @ImJohnMDaniel

## Context

Each generator script ended by running `sf project deploy start --ignore-conflicts` unless `--no-deploy` was passed. That fused deployment into generation with three defects: it deployed the entire project rather than the generated paths; the org write was the default and safety the opt-in; and `--ignore-conflicts` silently defeated source tracking — worst in shared sandboxes. It also fought the actual lifecycle: templates intentionally produce incomplete skeletons for the agent to finish (one case, injectable-method tests with `--params`, generates code that cannot compile until completed), so generate-then-immediately-deploy was guaranteed to fail in some workflows and created a retry trap — a failed deploy left files on disk, and a re-run reported "no changes" and skipped deployment entirely.

These scripts are agent-facing: humans are not expected to run them directly, so one-command convenience for interactive terminal use carries no weight.

## Decision

Deployment is removed from the generator scripts entirely. Scripts generate, report the created paths, and stop. The `--no-deploy` flags are removed.

The SKILL.md files define deployment as an explicit agent-owned workflow step, following the division of labor ratified in the #3 fix (scripts do deterministic scaffolding; the agent owns context-aware workflow steps): **generate → complete the implementation → deploy**, scoped to the touched paths via `--source-dir`, and never with `--ignore-conflicts` by default — a source-tracking conflict is a signal to stop and inspect, not to overwrite.

## Consequences

- The guaranteed-failure and retry-trap modes are structurally eliminated: generation and deployment can no longer half-succeed as a unit.
- Roughly 30 lines of duplicated deploy/error boilerplate leave each script; the shared-library extraction (issue #22) shrinks accordingly.
- Agents must be given clear deploy instructions in SKILL.md, including conflict handling.
