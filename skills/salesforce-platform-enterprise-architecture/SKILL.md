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
- **Trigger Scopes**: New triggers MUST include all 7 scopes (after insert, after update, before insert, before update, after delete, before delete, after undelete).

## Workflows

### 1. Designing a New Feature
- Identify the core SObjects involved (Domains/Selectors).
- Define the business process entry point (Service).
- Map the data flow and transaction boundaries (Unit of Work).

### 2. Refactoring Legacy Code
- Move SOQL from controllers/triggers to **Selectors**.
- Move DML and business logic from triggers to **Domains**.
- Move multi-object orchestration to **Services**.

### 3. Extending Existing Logic (Domain Process Injection)
Use this pattern to add logic to existing Domains, especially when the Domain class resides in a dependency package (like `universal-common`) and cannot be modified directly.

#### Automated Generation
To automate the creation of Criteria or Action classes and their Metadata bindings, run:

```bash
node ./scripts/create_injection.cjs <ComponentName> <SObjectName> <Type> [Operation] [Order]
```
- **Type**: `Criteria`, `CriteriaWithExistingRecs`, `Action`, `ActionWithExistingRecs`, `QueueableAction`

#### Framework-Managed Asynchronicity
When a process step requires asynchronous execution, set `ExecuteAsynchronous__c = true` and implement **`IDomainProcessQueueableAction`**.      

## Working with Dependency Packages
- **Redundancy**: If a redundant trigger exists (one calling a Domain handled by a dependency package), you MUST recommend **removing** the redundant trigger.
- **Selector Discovery**: Use `learn-org-metadata` to populate field lists, bypassing the 50-field limit for dependency selectors.

## Integration with Specialized Skills
- Use `manage-apex-selectors` to create/update Selector classes.
- Use `manage-apex-domains` to create/update Domain classes and Triggers.
- Use `learn-org-metadata` to retrieve schema details before implementation.
- Use `learn-org-symbol-table` to discover Apex class structures from the org.

## Resources

### scripts/
- `create_injection.cjs`: Automates component and binding creation.

### assets/
- `CriteriaTemplate.cls`: Boilerplate for `IDomainProcessCriteria`.
- `CriteriaWithExistingRecsTemplate.cls`: Boilerplate for `IDomainProcessCriteriaWithExistingRecs`.
- `ActionTemplate.cls`: Boilerplate for `IDomainProcessAction`.
- `ActionWithExistingRecsTemplate.cls`: Boilerplate for `IDomainProcessActionWithExistingRecs`.
- `QueueableActionTemplate.cls`: Boilerplate for `IDomainProcessQueueableAction`.
- `BindingTemplate.xml`: Boilerplate for `DomainProcessBinding__mdt`.

## References
- [at4dx-patterns.md](references/at4dx-patterns.md): Detailed implementation guide.
