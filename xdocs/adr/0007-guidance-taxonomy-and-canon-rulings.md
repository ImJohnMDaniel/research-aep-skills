# 0007. Guidance taxonomy and canon rulings

- **Status:** Accepted
- **Date:** 2026-08-30
- **Deciders:** @ImJohnMDaniel

## Context

For distribution beyond the originating project, every mandate in the skills must be classifiable: which rules travel unconditionally, which hold only under stated conditions, and which are per-project facts. The draft spoke in one absolute voice, so an agent could not tell framework truth from one shop's discipline — e.g., it would order deletion of a team's legitimate `User` trigger because the draft's ecosystem happened to delegate standard objects to a shared package. Discussion #26 debated this; the framework author issued rulings in working sessions on 2026-08-29/30. This ADR concludes that discussion.

## Decision — the taxonomy

Three tiers (a theorized fourth, "opinion profiles," ended the rulings with no members — see Consequences):

1. **Framework facts.** Behavior the frameworks and platform enforce; violating them errors. (`triggerHandler` takes `System.Type`; metadata-relationship restrictions; `OrderOfExecution__c` grouping semantics.) Ship unconditionally; largely generatable from framework source (issue #20).
2. **Canon.** Practices the frameworks are designed around, blessed by the author. Normative everywhere; some rules are *ownership-conditional* — their verdict depends on the ownership resolution below, not on any object's intrinsic type.
3. **Project conventions & hints.** Per-project facts resolved by convention (prefix), org discovery, and a small hint section in the project context file (`CLAUDE.md`/`GEMINI.md`). No configuration file — see the convention-over-configuration ruling.

## Decision — the canon rulings

1. **The Single-Ownership Principle.** Exactly one package in an org's ecosystem manages any given SObject. Ownership carries responsibility for that SObject's trigger, Domain, and Selector; every other package extends via Domain Process Injection / Selector Method Injection. Trigger legitimacy is derived: a trigger is legitimate iff it lives in the owning package. "Standard SObject" was never the operative property.
2. **Ownership resolves by convention, not configuration.** The org itself is the ownership registry: prefix naming makes ownership self-describing, org discovery verifies it live, and the residue (project prefix; which prefix manages standard objects) lives as hints in the project context file. A per-project ownership config file was rejected: it duplicates `sfdx-project.json` and the org, and becomes a synchronization liability in package-heavy orgs.
3. **Auxiliary objects (`__Share`, `__History`, `__ChangeEvent`, …).** (a) Always dedicated layers — never folded into the primary SObject's Selector/Domain. (b) Creating a project-owned custom SObject immediately establishes its full complement: Selector (class, interface, unit test, SelectorBinding), Domain (class, interface, unit test, trigger, DomainBinding), and UnitOfWorkBinding sequence. Auxiliary objects are the exception: layers on first need only.
4. **Selector return types.** `List<SObject>` or `Database.QueryLocator`, always. Single-record returns are banned — this enforces the bulkification standard.
5. **Single-responsibility selectors.** The selector's one job is returning record lists; any second purpose violates single responsibility. Specifically: no `Map<Id, SObject>` returns (re-keying is not a transformation, but it is another purpose — callers build maps); aggregate queries live in selectors and return `List<AggregateResult>` (callers extract values); wrapper/DTO returns are banned as **current canon, provisionally** — community debate on this topic is acknowledged, and guidance will be adjusted if the community position shifts.
6. **All 7 trigger scopes, in both modes.** AT4DX mode: binding metadata decides at runtime which events matter, so an omitted scope is a silent compile-time veto over future bindings, including other packages' injections. fflib-only mode: same ruling, same reasoning.
7. **Naming conventions are canon wholesale.** For large-scale enterprise application ecosystems, the strong naming convention is vital: without it, boundaries between applications, common-layer package modules, and frameworks/libraries become illegible. (Discovery's dependence on deducible names is one symptom of this larger point.) A proposed canon/profile split of the naming rules was rejected.

## Consequences

- Every contested rule was ruled canon; **opinion profiles are deferred entirely** — a future seam (the provisional DTO ruling is the likeliest first member) with no machinery built now.
- Architecture SKILL.md language rewrites from "standard or external SObject" to ownership terms (folded into issue #19 with the hint-format spec).
- Ruling 3(b) defines a new-SObject scaffolding workflow (filed as its own issue).
- The linter (issue #24) aligns: single-record returns and DTO returns as violations, `List<AggregateResult>` permitted, map returns flagged, all-7-scopes checked.
- The selectors SKILL.md gains the ruling-5 precision cases explicitly.
