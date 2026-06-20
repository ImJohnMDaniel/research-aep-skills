---
name: manage-apex-domains
description: Automates the creation, surgical update, and extension of standard Apex Domain layers for SObjects following AT4DX patterns. This skill manages Domain classes, interfaces, triggers, and the Domain Process Injection pattern (Criteria/Actions/Bindings).
---

# Manage Apex Domains (AT4DX)

This skill manages the "Domain" layer for an SObject, including both the core class structure and the **Domain Process Injection** pattern for modular extension, following the AT4DX architectural standard.

## Architectural Mandates

- **Inheritance**: All Domain classes MUST inherit from `ApplicationSObjectDomain`.
- **Interfaces**: All Domains MUST implement a corresponding interface (e.g., `IAccounts`) which extends `IApplicationSObjectDomain`.
- **Factory Registration**: Domains MUST be registered via `ApplicationFactory_DomainBinding` custom metadata to enable Force-DI resolution.
- **Access**: Use the `newInstance()` static methods via the `Application.Domain` factory.
- **Trigger Scopes**: All triggers MUST include all 7 scopes (after insert, after update, before insert, before update, after delete, before delete, after undelete).
- **Injection Pattern**: Use Domain Process Injection to add logic to existing Domains, especially those in dependency packages (like `universal-common`).

- **Naming Conventions**:
  - **Domain Class**: `{Prefix}_{PluralSObjectName}` (e.g., `EEORA_AccommRequests`)
  - **Interface**: `{Prefix}_I{PluralSObjectName}` (e.g., `EEORA_IAccommRequests`)
  - **Trigger**: `{Prefix}_{PluralSObjectName}` (e.g., `EEORA_AccommRequests`)

## Workflows

**SObject Type Analysis (Pre-Check)**

Before proceeding with any Domain creation or update, the agent MUST first analyze the SObject API name:

-   **If the SObject has the project prefix (e.g., `EEORA_MyObject__c`):** Proceed to "1. Core Domain Management" to create/update a project-specific Domain.
-   **If the SObject is Standard (`User`, `Account`) or from another package (`OtherPrefix__Object__c`):** **STOP.** Do not create a new Domain. The Domain is assumed to exist in a dependency package. Use the `learn-org-symbol-table` skill to discover the API for the existing domain (e.g., `UCMN_Accounts`) and use that in your implementation. This skill should only be used for project-specific SObjects.

### 1. Core Domain Management
Generates or surgically updates the Domain class, Interface, Trigger, and Unit Test.

1.  **Validation:** Checks if the SObject exists in the local project's metadata.
2.  **Surgical Update / Creation:**
    *   If files don't exist, they are created from templates in the `assets/` folder.
    *   If files exist (Domain, Interface, Trigger, Test), the skill surgically inserts required boilerplate (like `newInstance` methods or `Constructor` inner classes) while **preserving all existing methods and custom logic**.
3.  **Naming:** Applies the `{APP_PREFIX}_{PluralSObject}` convention (40-char limit), handling standard/custom objects appropriately.
4.  **Auto-Deployment:** After files are ready, the skill automatically executes `sf project deploy start` to sync the changes to your default org.

- **Usage**:
To generate or update a domain, run the bundled script:

  ```bash
  node ./scripts/create_domain.cjs <SObjectName> [AppPrefix]
  ```

Example:
```bash
node ./scripts/create_domain.cjs Account EEORA
```

### 2. Domain Process Injection (Modular Extension)
Automates the creation of modular Criteria or Action classes and their Metadata bindings to inject logic into an existing Domain flow.
- **Usage**:
  ```bash
  node ./scripts/create_injection.cjs <ComponentName> <SObjectName> <Type> [Operation] [Order]
  ```
- **Types**: `Criteria`, `CriteriaWithExistingRecs`, `Action`, `ActionWithExistingRecs`, `QueueableAction`.
- **Asynchronicity**: For async steps, set `ExecuteAsynchronous__c = true` and use `QueueableAction`.

## Resources

### scripts/
- `create_domain.cjs`: Manages standard Domain layers.
- `create_injection.cjs`: Manages injectable modular components.

### assets/
- `DomainTemplate.cls`, `InterfaceTemplate.cls`, `TriggerTemplate.trigger`, `TestTemplate.cls`
- `CriteriaTemplate.cls`, `CriteriaWithExistingRecsTemplate.cls`
- `ActionTemplate.cls`, `ActionWithExistingRecsTemplate.cls`
- `QueueableActionTemplate.cls`
- `BindingTemplate.xml`: Universal template for both Domain and Process bindings.
