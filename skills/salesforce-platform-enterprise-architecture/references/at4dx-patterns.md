# AT4DX Pattern Implementation Guide

This guide details the implementation of Apex Enterprise Patterns using the **AT4DX** framework, which extends the base fflib libraries.

## Service Layer
- **Responsibility**: Business logic orchestration and transaction management.
- **Implementation**: Implementation class + Interface (e.g., `IAccountsService`).
- **Registration**: Registered in `ApplicationServiceDIModule`.
- **Calling**: Always via the `Application` factory:
  ```apex
  IAccountsService service = (IAccountsService) Application.Service.newInstance(IAccountsService.class);
  ```

## Domain Layer
- **Responsibility**: SObject-specific logic and trigger handling.
- **Inheritance**: MUST extend `ApplicationSObjectDomain`.
- **Interface**: MUST implement an interface extending `IApplicationSObjectDomain`.
- **Calling**: `IAccounts domain = (IAccounts) Application.Domain.newInstance(records);`

## Domain Process Injection (Advanced Pattern)
Use this pattern to add logic to existing Domains, especially when the Domain class resides in a dependency package (like `universal-common`) and cannot be modified directly.

### Components
1.  **Criteria**: Filters the initial record set to a qualified subset.
    - Implement `IDomainProcessCriteria` or `IDomainProcessCriteriaWithExistingRecs`.
2.  **Action**: Performs discrete operations on the filtered subset.
    - MUST extend `DomainProcessAbstractAction`.
    - Implement `IDomainProcessAction` or `IDomainProcessActionWithExistingRecs`.

### Configuration (DomainProcessBinding__mdt)
Logic is orchestrated via Custom Metadata using the `OrderOfExecution__c` field:
- **Process ID**: The whole number portion (e.g., `10.0`) identifies the distinct process.
- **Step Sequence**: The decimal portion (e.g., `10.1`, `10.2`) defines the execution order of criteria and actions within that process.

> **Mandate**: Always search for and reuse existing Criteria and Actions from dependency packages before creating new ones.

## Selector Layer
- **Responsibility**: Encapsulated SOQL queries.
- **Inheritance**: MUST extend `ApplicationSObjectSelector`.
- **Interface**: MUST implement an interface extending `IApplicationSObjectSelector`.
- **Calling**: `IAccountsSelector selector = (IAccountsSelector) Application.Selector.newInstance(Account.SObjectType);`

## Unit of Work
- **Responsibility**: Managing database transactions (DML).
- **Interface**: Use `IApplicationSObjectUnitOfWork`.
- **Calling**:
  ```apex
  IApplicationSObjectUnitOfWork uow = Application.UnitOfWork.newInstance();
  uow.registerNew(myRecord);
  uow.commitWork();
  ```

## Working with Dependency Packages (e.g., universal-common)
If the project has a dependency on `universal-common` (prefix `UCMN`), most standard SObject selectors and domains already exist (e.g., `UCMN_AccountsSelector`, `UCMN_Accounts`).

### Discovery Workflow
1.  **Deduce Name**: Based on the `UCMN` prefix and standard pluralization (e.g., `UCMN_UsersSelector`).
2.  **Check Local Symbols**: Look in `.gemini/org-symbols/<OrgID>/` for the deduced class.
3.  **Fetch if Missing**: If the deduced class is not found locally, use the `learn-org-symbol-table` skill to fetch it:
    ```bash
    node C:\Users\BBIJS1O\workspace\gemini-extensions\sf-aep-skills\skills\learn-org-symbol-table\scripts\learn_symbols.cjs UCMN_UsersSelector
    ```
4.  **Evaluate**: Inspect the `SymbolTable` JSON to see existing methods/fields.
    - **Trigger Existence**: If a Domain class exists for an SObject, assume a corresponding trigger also exists for that SObject in that package.
    - **Logic Extension**: If the required logic is missing, implement **Domain Process Injection** rather than creating a new Domain class.
    - **Redundancy**: If a redundant trigger exists in the current project (one that calls a Domain already handled by a dependency package's trigger), the agent MUST recommend **removing** the redundant trigger instead of updating it.
