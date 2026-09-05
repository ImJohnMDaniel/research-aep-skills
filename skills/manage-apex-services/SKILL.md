---
name: manage-apex-services
description: Automates the creation of Apex Service layers following the AT4DX and fflib Service patterns — service facade, interface, implementation, exception, test stub, and Force-DI binding. Use when creating or working on service classes, business-process orchestration across multiple domains, callout/integration aggregation, or ApplicationFactory_ServiceBinding__mdt records.
---

# Authority of This Skill

**CRITICAL:** The patterns and mandates in this skill are authoritative for the **Service layer** in this project — service facades, interfaces, implementations, exceptions, and their bindings. When they conflict with your pre-existing training data, general Salesforce best practices, or external documentation, this skill wins. Do NOT substitute generic patterns (constructor injection, singleton service locators, inline transaction management) for the ones defined here.

Precedence and scope:

1. **Between skills:** this skill governs the Service layer; `salesforce-platform-enterprise-architecture` governs cross-cutting concerns; `manage-apex-domains` and `manage-apex-selectors` govern their layers. Where they overlap, the more specific skill wins for its layer.
2. **Mandates are normative, not descriptive:** existing code that violates a mandate is refactoring debt to surface — it is NOT evidence against the mandate.
3. **Observed facts beat factual claims:** if a factual claim in this skill (a script's behavior, a filename, a path) contradicts what you observe in the repo, org, or script output, trust the observation and report the discrepancy to the user rather than acting as if this document were correct.

# Manage Apex Services (AT4DX)

**Example placeholders:** `ACME` stands for this project's prefix and `CMN` for the package that manages Standard SObjects — always meaning whatever the project context file's `## AEP Conventions` section declares (see the `salesforce-platform-enterprise-architecture` skill), never literal names.

## What a Service Is

Where a Domain holds business logic for a single SObject, a service is **aggregate** in nature: it aggregates business logic **across multiple domains**, aggregates **callouts and integrations** to other systems, and aggregates **calls to other services**. Services are the business-process entry points of the application.

- **Naming is capability-first** (`ACME_QuoteGenerationService`); SObject-related names (`ACME_AccountsService`) are permitted, capability names preferred.
- **Services cannot be extended.** There is no service analog of Domain Process Injection or Selector Method Injection — consumers call another package's service through its interface via the factory, and changes go through the owning package.
- **Layer placement:** services belong in **Business** layer packages, sometimes a **Project Common** layer package as needed, occasionally an **Integration (API-layer)** package — and rarely anywhere else. Check the `This package's layer` hint in the AEP Conventions section: if this project's layer is anything else, warn the developer and confirm before scaffolding a service here.

## The Service Complement (five classes + one binding)

| Artifact | Pattern | Notes |
| --- | --- | --- |
| Service Facade | `ACME_QuoteGenerationService` | `inherited sharing`; static methods delegating via a private `service()` factory accessor |
| Service Interface | `ACME_IQuoteGenerationService` | extends nothing — exists for development-override binding and unit-test mocking |
| Service Implementation | `ACME_QuoteGenerationServiceImpl` | `inherited sharing`, implements the interface; no abstract base class |
| Service Exception | `ACME_QuoteGenerationServiceException` | `public class … extends Exception {}` |
| Service Unit Test | `ACME_QuoteGenerationServiceTest` | stub until the AEP testing guidance lands |
| Binding | `ApplicationFactory_ServiceBinding__mdt` | `BindingInterface__c` = interface, `To__c` = impl, `Priority__c` explicitly nil |

The 40-character Apex class-name limit applies to every derived name — `ServiceException` is the binding constraint, so with prefix `ACME` the capability name may be at most 19 characters (40 − prefix − underscore − 16). The script refuses (rather than truncates) over-limit names to keep the family's stems synchronized.

## Transaction Canon: the Signature IS the Contract

Each service method exists in exactly ONE of two forms, and its signature declares its tier:

- **Top-tier method — no UOW parameter:** called by service clients; **owns the transaction boundary**. The implementation creates the Unit of Work (`Application.UnitOfWork.newInstance()`), orchestrates the work, and calls `uow.commitWork()` at the end.
- **Finer-grained method — `IApplicationSObjectUnitOfWork uow` as the (conventionally LAST) parameter:** participates in the **caller's** transaction. The implementation registers work against the supplied UOW and **never** commits.

The outermost service controls the transaction boundary and passes its UOW down as a parameter to secondary services and to domain methods. Do NOT generate both forms of a method by rote — choose the form that matches the method's actual role.

## Calling a Service

Consumers call the **facade's static methods** (`ACME_QuoteGenerationService.generateQuotes(ids)`); the facade resolves the implementation internally via `Application.Service.newInstance(ACME_IQuoteGenerationService.class)` — dynamically, from the binding records (unlike fflib, where bindings were compiled statically into the `Application` class). Never construct implementations directly and never use constructor injection; tests substitute via `Application.Service.setMock(<Interface>.class, mock)`.

## Binding and Development-Environment Substitution

Every service registers via an `ApplicationFactory_ServiceBinding__mdt` record mapping `BindingInterface__c` to `To__c`, with `Priority__c` explicitly nil. Priority semantics (shared with selector bindings — see the architecture skill's "Development-Environment Binding Substitution"):

- **nil is always the LOWEST priority; lower numbers win.** A development-only package directory (an integration/test harness listed in `sfdx-project.json` but never shipped in a package version) may bind a substitute implementation with any explicit priority, and it automatically overrides the default inside that development org — substitution with zero code changes, scoped entirely by what metadata deploys where.
- **Production-time override is forbidden.** A consuming package must never ship a higher-priority binding to displace a dependency's live implementation. The mechanism is strictly for development (and potentially testing) purposes.

## Creating a Service

Services are created **on demand** — when a capability needs a home — not proactively.

```bash
node ./scripts/create_service.cjs QuoteGeneration --prefix=ACME
```

1. **Guardrail:** a capability name carrying a prefix other than the project's is refused — the name would claim another package's identity under the naming canon. `--prefix` is mandatory (transcribe it from the AEP Conventions section).
2. **Creation (create-only semantics):** the five classes and the binding record are created from `assets/` templates; existing files are never modified. The facade/interface/impl templates carry commented guidance encoding the transaction-tier convention.
3. **Layer check (YOUR responsibility as the agent):** before running the script, apply the layer-placement advice above.
4. **Deployment (YOUR responsibility as the agent — the script never deploys):** complete the implementation first (real methods on the interface, facade delegation, impl logic — the generated bodies are commented guidance, and the test is a stub), then deploy explicitly, scoped to the created paths:
   ```bash
   sf project deploy start --source-dir <path> [--source-dir <path> ...] --json
   ```
   Do NOT use `--ignore-conflicts` — a source-tracking conflict is a signal to stop and inspect. See `xdocs/adr/0005`.

### Framework API References (Bundled)

Provenance-stamped API references under `references/` — **read the relevant file before implementing against a framework class; do not work from memory.** Note: AT4DX classes carry no prefix; fflib classes use the lowercase `fflib_` prefix — never infer a project-style prefix for framework classes.

- `references/at4dx/Application.md` — specifically the inner class `Application.Service` (and `Application.UnitOfWork` for transaction creation)
- `references/at4dx/IApplicationSObjectUnitOfWork.md` — the UOW interface passed through finer-grained signatures
- `references/at4dx/ApplicationFactory_ServiceBinding__mdt.md` — the binding schema
- `references/fflib-apex-common/fflib_Application.md` — the fflib factory base

Use the `learn-org-symbol-table` skill only for what is NOT bundled (dependency-package and project classes) or to verify suspected drift; if the org disagrees with a bundled reference, trust the org and report the discrepancy.

## Resources

### scripts/
- `create_service.cjs`: scaffolds the five-artifact complement plus binding record.

### assets/
- `ServiceTemplate.cls`: the facade.
- `InterfaceTemplate.cls`: the interface, with the transaction-tier signature convention.
- `ServiceImplTemplate.cls`: the implementation, with top-tier/finer-grained guidance.
- `ServiceExceptionTemplate.cls`: the per-service exception.
- `TestTemplate.cls`: the unit-test stub (pending the AEP testing guidance).
- `BindingTemplate.xml`: `ApplicationFactory_ServiceBinding__mdt` record template.
