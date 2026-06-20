---
name: salesforce-platform-enterprise-architecture
description: High-level management of Salesforce Apex Enterprise Patterns (fflib/AT4DX) for complex features. Use when designing, refactoring, or implementing large-scale logic across Service, Domain, Selector, and Unit of Work layers.
---

# Salesforce Platform Enterprise Architecture (AT4DX)

This skill provides the architectural framework and procedural guidance for implementing large-scale Salesforce applications using the **Apex Enterprise Patterns** (fflib) and **AT4DX** standards.

When this skill is active, you must analyze and provide recommendations that align with the principles of the Apex Enterprise Patterns. Your first step is to check the project's configuration to tailor your advice.

Follow this procedure:
  
   1.  **Verify Project Dependencies:**
       *   Read the `sfdx-project.json` file to check for dependencies on **`fflib-apex-common`** and **`at4dx`**.
  
   2.  **Determine Advisory Path based on Verification:**
  
       *   **PATH A: Dependencies ARE PRESENT**
           *   The project is configured for the full fflib/AT4DX framework.
           *   Proceed with the user's request, ensuring all analysis, recommendations, and generated code strictly utilize the library's base classes (e.g., `ApplicationSObjectSelector`, `fflib_SObjectDomain`). Your recommendations should enforce the correct use of installed framework.

       *   **PATH B: Dependencies ARE ABSENT**
           *   The project does not have the fflib libraries installed. Proceed with the user's request by providing **established Salesforce architectural advice** based on the *principles* of the Enterprise Patterns (e.g., Separation of Concerns, Bulkification, Layering).
           *   When you identify a violation of these principles (such as a SOQL query inside a service class), recommend creating a plain Apex class that emulates the correct pattern (e.g., a new `MyObjectSelector` class).
           *   As part of your recommendation, you should frame this as an adjustment to align with best practices and suggest the official libraries as the ideal next step. For example:
               > "To better align with the established architectural principle of Separation of Concerns, I recommend moving this SOQL query into a new, dedicated `YourObjectSelector` class. This is a foundational step in implementing the Selector pattern. For more advanced features and to fully adopt the Apex Enterprise Patterns, the best practice would be to add the `fflib-apex-common` and `at4dx` dependencies. Would you like me to help you create the plain Apex selector class now?"

## Core Architectural Layers

1.  **Service Layer**: Encapsulates business processes and orchestration.
2.  **Domain Layer**: Encapsulates SObject-specific validation, defaults, and business logic. Managed via `manage-apex-domains`.
3.  **Selector Layer**: Encapsulates SOQL queries, ensuring consistency and security. Managed via `manage-apex-selectors`.
4.  **Unit of Work**: Manages transactionality and DML orchestration using `IApplicationSObjectUnitOfWork`.

## Architectural Mandates

- **Separation of Concerns**: Never perform DML in Selectors. Never put complex business logic in Triggers.
- **Dependency Injection**: Use the `Application` factory (Force-DI) to instantiate layers.
- **Naming Conventions**: All classes MUST follow the project prefix (e.g., `EEORA_`).
- **Interfaces**: All layers MUST be accessed via interfaces to support mock-based unit testing.

### Project-Specific vs. Universal Components

A fundamental principle of this architecture is the separation of concerns between project-specific code and shared, universal components (often from dependency packages like `universal-common`).

-   **Project-Specific SObjects**: SObjects with the project's prefix (e.g., `EEORA_`) are managed directly by this project's skills.
-   **Standard & External SObjects**: Standard Salesforce SObjects (`Account`, `User`, etc.) or SObjects from other packages (`OtherPrefix__Object__c`) are considered "universal". You **MUST** assume that their corresponding Apex Enterprise Pattern layers (Domain, Selector) already exist in a shared dependency.

**CRITICAL**: Before creating a new Domain or Selector for a standard or external SObject, you **MUST** use the `learn-org-symbol-table` skill to find and utilize the existing component (e.g., `UCMN_UsersSelector`). Creating a duplicate layer for a non-project SObject is a critical architectural violation.

## Workflows

### 0. Batch Operations (Mandatory)
For all tasks involving more than 2 file changes, you MUST batch operations using `skills/salesforce-platform-enterprise-architecture/scripts/apex_orchestrator.cjs`. This ensures atomicity and consistency.

### 1. Designing a New Feature
- Identify the core SObjects involved (Domains/Selectors).
- Define the business process entry point (Service).
- Map the data flow and transaction boundaries (Unit of Work).

### 2. Refactoring Legacy Code
- Move SOQL from controllers/triggers to **Selectors**.
- Move DML and business logic from triggers to **Domains**.
- Move multi-object orchestration to **Services**.

### 3. Extending Existing Logic (Domain Process Injection)
Use this pattern to add logic to existing Domains, especially those in dependency packages (like `universal-common`). Automated tools for this pattern are available in the **`manage-apex-domains`** skill.

## Working with Dependency Packages
- **Redundancy**: If a redundant trigger exists, you MUST recommend **removing** it and using Domain Process Injection instead.
- **Selector Discovery**: Use `learn-org-metadata` to populate field lists for dependency selectors.

## Integration with Specialized Skills
- Use **`manage-apex-domains`** to create/update Domain classes, Triggers, and Injected components (Criteria/Actions).
- Use **`manage-apex-selectors`** to create/update Selector classes.
- Use **`learn-org-metadata`** to retrieve schema details before implementation.
- Use **`learn-org-symbol-table`** to discover Apex class structures from the org.

## References
- [at4dx-patterns.md](references/at4dx-patterns.md): Detailed implementation guide.
