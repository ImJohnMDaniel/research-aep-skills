# 0006. No batch orchestrator; the agent orchestrates

- **Status:** Accepted
- **Date:** 2026-08-29
- **Deciders:** @ImJohnMDaniel

## Context

The draft contained a batch orchestrator (`apex_orchestrator.cjs`): a JSON-manifest executor for create/register/delete operations, intended to cut a 10–12-turn multi-file refactor to one call. Two divergent copies existed (repo root and the architecture skill's `scripts/`), both with the `register` action — the one that writes DI binding metadata, the most delicate artifact in AT4DX — implemented as a silent stub, and with output paths hardcoded to layouts that disagreed with each other and with what the per-layer generators derive from `sfdx-project.json`. Meanwhile the architecture SKILL.md *mandated* its use for any task over 2 file changes, routing agents away from the guarded per-layer scripts and into a tool that no-ops bindings and reports success.

The premise has also aged: in an agent product, **the agent is the orchestrator**. Each per-layer script already batches an entire layer's artifacts in one call; the agent sequences multiple script calls within a turn. The orchestrator's claimed atomicity was never real (sequential execution with per-operation try/catch), and its file-creation logic was a second, parallel implementation of what the per-layer scripts do — the maintenance disease that produced the `__Share` divergence bug, at larger scale.

## Decision

1. Both orchestrator copies and `orchestrator_implementation_guide.md` are deleted (git history preserves them). The "Batch Operations (Mandatory)" workflow is removed from the architecture SKILL.md.
2. Deterministic tooling stays **per-operation**; multi-step sequencing is the agent's responsibility, consistent with the division of labor in ADR-0005 and the #3 resolution.
3. The one idea worth rescuing — a mechanical guardrail refusing to scaffold Domains/Selectors for standard SObjects — moves into the per-layer generators (issue #29).
4. This position is provisional against real-world testing: if usage shows a refactoring workflow that per-layer scripts plus agent sequencing genuinely cannot cover, that evidence reopens the question. Any future batching tool must be a thin wrapper that **delegates to** the per-layer scripts, never a parallel implementation of file creation.

## Consequences

- The active hazard (a mandated tool that silently skips binding metadata) is gone.
- One less parallel implementation to keep in sync; the shared-library work (issue #22) has a smaller surface.
- Multi-file refactors cost the agent several tool calls instead of one — accepted until evidence says otherwise.
