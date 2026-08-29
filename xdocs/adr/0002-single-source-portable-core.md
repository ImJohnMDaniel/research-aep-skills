# 0002. Single-source portable core with thin platform adapters

- **Status:** Accepted
- **Date:** 2026-08-29
- **Deciders:** @ImJohnMDaniel

## Context

The skills must ship as both a Claude Code plugin and a Gemini CLI extension. Claude and Gemini have converged on essentially the same SKILL.md format, but the research draft contains Gemini-specific assumptions (`.gemini/` cache paths, `GEMINI.md` references, `IS_GEMINI_AGENT` env checks, `gemini-extension.json` as the only manifest). Grok Build compatibility is a noted future consideration, not a current design driver.

## Decision

One canonical, platform-neutral `skills/` tree is the single source. Platform support is delivered by thin adapters only: `gemini-extension.json` for Gemini CLI and a `.claude-plugin/` manifest for Claude Code.

Neutrality rules for the core (enforced by a lint/build check, issue #21):

1. No `.gemini/`, `GEMINI.md`, or other platform-specific paths/names in skill text or scripts; cache locations and context-file names come from the project configuration layer (issue #19).
2. No platform-identifying environment variables; scripts detect non-interactive execution via TTY inspection (issue #8).
3. Bundled scripts remain zero-install for both agents: plain Node invoking the `sf` CLI. If scripts migrate to TypeScript (issue #23), they compile/bundle to standalone JS at build time.

## Consequences

- Adding a platform later (e.g., Grok Build) means writing an adapter, not forking content.
- A build step exists from early on; it is also the natural home for framework-reference generation (issue #20) and neutrality linting.
- Existing draft content requires a de-Gemini-ing pass (issues #7, #8).
