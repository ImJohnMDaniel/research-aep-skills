# 0009. Testing strategy: four layers, evals as the behavioral harness

- **Status:** Accepted
- **Date:** 2026-09-01
- **Deciders:** @ImJohnMDaniel

## Context

The product has four distinct testable surfaces needing different techniques, and the v0.1 field-test cycle produced the evidence base: three real findings (a layer/coverage conflation, a case-sensitivity bug, and weak-model interview non-compliance) found by real-project usage within days, none by pre-release checks. Finding #3 additionally established that cross-**model** compliance (pro-tier vs. flash-tier) matters as much as cross-platform packaging. Claude Code ships an early-access `claude plugin eval` harness — repo-committed eval cases (prompt + graders: regex, tool_used, tool_order, file_exists, LLM-judge, baseline; fixture workspaces via `case.yaml`; ablation with/without plugin; JSON output, thresholds, exit codes, cost ceilings) — currently gated pending an enablement variable.

## Decision — the four layers

1. **Deterministic scripts** — `node --test` unit tests (zero-dependency, consistent with ADR-0002), authored **as part of the shared-library extraction (#22)**, not before it: the extraction is what makes the helpers importable, and pre-extraction tests would be throwaway.
2. **Static checks** — `build/lint_parity.cjs` (manifest parity; platform neutrality; **doc integrity**: every skill-relative path and ADR citation in a SKILL.md must exist) plus `claude plugin validate`. The doc-integrity check caught real rot on its first run.
3. **Agent behavior** — a committed eval suite (`evals/`) of fixture projects + probe prompts + mechanical graders, targeting the proven risk scenarios: ownership resolution, interview compliance, guardrail respect, refusal-to-guess. Runs via `claude plugin eval` once enabled; until then the same fixtures run as manual headless probes. The **same fixtures** run manually via the Gemini CLI on the Gemini machine. Grading is mechanical wherever possible; LLM-judge graders only for inherently fuzzy quality; human effort goes to reading failures.
4. **Field testing** — real projects on both platforms, findings logged on a standing per-cycle field-findings issue (the pattern that emerged on #34), with the rule-fix-fast-forward loop demonstrated in the v0.1 cycle.

## Decision — policies

- **Release gate:** layers 1+2 green; layer-3 suite green on Claude; the same fixtures manually green on Gemini; zero open regressions on the cycle's field-findings issue.
- **Flash-tier pass:** periodic spot-check, not a standing gate.
- **Cadence ownership:** Claude-side runs are automated on the primary machine; Gemini-side runs are the maintainer's, on the Gemini machine, as a documented manual protocol (the Gemini CLI lives on a separate machine).
- **Ordering:** the behavioral net (layers 2+3) is built **before** the #22 refactor, which then carries its own layer-1 tests — safety net before furniture-moving. #22's scope is internal-only: script CLI contracts (flags, outputs) do not change, so evals authored now remain valid.
- **Scratch-org integration runs** (reference generation, live inventory validation) stay manual-cadence; CI investment is deferred until the apex-enterprise-patterns transfer justifies a pipeline (needs both CLIs plus a Dev Hub in CI).

## Consequences

- Eval-suite authoring is a v0.2 work item; the plugin-eval enablement variable is requested from the maintainer's Anthropic contact in parallel.
- The flash-model retest of the hardened onboarding interview (#34) becomes the first periodic spot-check.
- A "field findings — v0.2" issue opens with the cycle.
