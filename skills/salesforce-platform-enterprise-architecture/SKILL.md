---
name: salesforce-platform-enterprise-architecture
description: High-level management of Salesforce Apex Enterprise Patterns (fflib/AT4DX) for complex features. Use when designing, refactoring, or implementing large-scale logic across Service, Domain, Selector, and Unit of Work layers.
---

# Salesforce Platform Enterprise Architecture (AT4DX)

This skill provides the architectural framework and procedural guidance for implementing large-scale Salesforce applications using the **Apex Enterprise Patterns** (fflib) and **AT4DX** standards.

## Core Architectural Layers

1.  **Service Layer**: Encapsulates business processes and orchestration. Entry point for external consumers (APIs, UI Controllers).
2.  **Domain Layer**: Encapsulates SObject-specific validation, defaults, and business logic. Trigger logic MUST reside here. Uses `ApplicationSObjectDomain`.
3.  **Selector Layer**: Encapsulates SOQL queries, ensuring consistency and security. Uses `ApplicationSObjectSelector`.
4.  **Unit of Work**: Manages transactionality and DML orchestration using `IApplicationSObjectUnitOfWork`.

## Architectural Mandates

- **Separation of Concerns**: Never perform DML in Selectors. Never put complex business logic in Triggers.
- **Dependency Injection**: Use the `Application` factory (Force-DI) to instantiate layers.
- **Naming Conventions**: All classes MUST follow the project prefix (e.g., `EEORA_`).
- **Interfaces**: All layers MUST be accessed via interfaces (e.g., `IApplicationSObjectUnitOfWork`) to support mock-based unit testing.

## Workflows

### 1. Designing a New Feature
- Identify the core SObjects involved (Domains/Selectors).
- Define the business process entry point (Service).
- Map the data flow and transaction boundaries (Unit of Work).

### 2. Refactoring Legacy Code
- Move SOQL from controllers/triggers to **Selectors**.
- Move DML and business logic from triggers to **Domains**.
- Move multi-object orchestration to **Services**.

## Integration with Specialized Skills

- Use `manage-apex-selectors` to create/update Selector classes.
- Use `manage-apex-domains` to create/update Domain classes and Triggers.

## References

- [at4dx-patterns.md](references/at4dx-patterns.md): Detailed guide on implementing each layer using AT4DX.
