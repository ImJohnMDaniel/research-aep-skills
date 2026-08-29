# 0003. Work tracking: Issues, Discussions, ADRs

- **Status:** Accepted
- **Date:** 2026-08-29
- **Deciders:** @ImJohnMDaniel

## Context

The project needs a backlog and a decision trail that survive the planned repository transfer to the apex-enterprise-patterns organization (ADR-0001). GitHub Issues and Discussions transfer with a repository; Projects v2 boards do not.

## Decision

- **GitHub Issues** are the backlog of record. Labels: `type:decision`, `skill:*`, `area:tooling` / `area:packaging` / `area:canon`, plus default `bug` / `enhancement` / `documentation`. Milestones scope releases.
- **GitHub Discussions** host open design debates. A debate concludes by producing an ADR.
- **`xdocs/adr/`** records decisions once made; ADRs spawn implementation issues.
- **Projects boards** are optional visualization only — recreated at will, never the system of record.
- In-repo markdown backlogs (formerly `xdocs/backlog.md`) are retired in favor of issues; a backlog in two places is a backlog in no places.

## Consequences

- Everything of record transfers with the repo.
- The initial backlog was seeded 2026-08-29 as issues #1–#25 (bugs from the draft code review, features from the former xdocs/backlog.md, and architecture workstreams), with Discussions #26 (canon vs. house rules) and #27 (v0.1 scope) opened.
