---
name: manage-apex-selectors
description: Automates the creation and maintenance of Apex Selector classes following the AT4DX and fflib Selector patterns. Use this skill when creating new Selector layers for SObjects, ensuring they inherit from ApplicationSObjectSelector and are registered via Force-DI bindings.
---

# Manage Apex Selectors (AT4DX)

This skill manages the "Selector" layer for an SObject, following the AT4DX architectural standard.

## Architectural Mandates

- **Inheritance**: All Selector classes MUST inherit from `ApplicationSObjectSelector`.
- **Interfaces**: All Selectors MUST implement a corresponding interface (e.g., `IAccountsSelector`) which extends `IApplicationSObjectSelector` when `at4dx` is present in the project's dependencies. If `at4dx` is not present, custom interfaces are optional but recommended.
- **Factory Registration**: Selectors MUST be registered via `ApplicationFactory_SelectorBinding` custom metadata to enable Force-DI resolution.
- **Calling Selectors**: Always call the selector's static `newInstance()` method directly within your business logic. Do not store selectors as instance variables or inject them via the constructor. This pattern is an anti-pattern in AT4DX as mocking is handled by the Application Factory. See the main `salesforce-platform-enterprise-architecture` skill for detailed examples.
- **Access**: Use the `newInstance()` static method to access selectors via the `Application.Selector` factory.
- **Strict Return Types (No Transformations / Single Records)**: All custom query methods in a Selector class MUST only return either a `List<SObject>` or a `Database.QueryLocator`. They **MUST NOT**:
  - Return a single `SObject` record (e.g., `User` instead of `List<User>`), as this violates the platform's **bulkification mandate** and is a critical anti-pattern.
  - Return any non-SObject collection types or maps of primitives (e.g., `Set<String>`, `Map<String, Id>`), as **Selectors must never perform data transformations**; this logic belongs in the calling Service, Domain, or Action layer.
- **One Selector, One SObject**: A Selector class is strictly responsible for querying a single SObject. It is a critical anti-pattern for a selector to query another SObject's data, even if it is a related child or parent. Instead, you must invoke the appropriate selector for that object. For example, `AccountSelector` must not query for `Contact` records; it must call `ContactsSelector.newInstance()`. This is enforced by ensuring any call to `newQueryFactory(SomeObject__c.SObjectType)` uses an SObject type that matches the selector's own `getSObjectType()`.

- **Naming Conventions**:
  - **Selector Class**: `{Prefix}_{PluralSObjectName}Selector` (e.g., `EEORA_AccommRequestsSelector`)
  - **Interface**: `{Prefix}_I{PluralSObjectName}Selector` (e.g., `EEORA_IAccommRequestsSelector`)

## Workflow

**0. Dependency Check (Pre-Check)**

Before creating or refactoring a selector, the agent MUST inspect `sfdx-project.json` for project dependencies:
-   **If `at4dx` is a dependency:** You **MUST** generate both the concrete selector class and its corresponding interface (extending `IApplicationSObjectSelector`). Omitting the interface is a critical architectural violation under `AT4DX`.
-   **If `at4dx` is NOT a dependency:** The interface is optional (Class-Based approach is allowed to reduce boilerplate), though still recommended if dynamic binding is needed.

**1. SObject Type Analysis (Pre-Check)**

Before proceeding, the agent MUST first analyze the SObject API name:

-   **If the SObject has the project prefix (e.g., `EEORA_MyObject__c`):** Proceed to the next step to create a new, project-specific Selector.
-   **If the SObject is Standard (`User`, `Account`) or from another package (`OtherPrefix__Object__c`):** **STOP.** Do not create a new Selector. The Selector is assumed to exist in a dependency package. Use the `learn-org-symbol-table` skill to discover the API for the existing selector (e.g., `UCMN_AccountsSelector`) and use that in your implementation. This skill should only be used for project-specific SObjects.     

**2. Field List Population**:
- Before creating or updating a selector, the agent MUST use the `learn-org-metadata` skill to retrieve the SObject's field list.
- **Filter**: Exclude all fields with `LongTextArea` or `RichTextArea` data types (`textarea` type with `htmlFormatted: true` or large length) to prevent heap size issues.
- **Verification**: If the filtered list contains more than **50 fields** AND the selector class is part of the **current project**, the agent MUST verify with the user via `ask_user` if they wish to include all fields. If the selector is part of a **dependency project** (not in the local source), ignore the 50-field verification and include the fields as needed (or as directed).
**3. Creation / Update**: Generates or surgically updates the Selector class, Interface, and Unit Test.
**4. Binding**: Creates a custom metadata record in `selectorBindings`.
...
**5. Deployment**: Automatically deploys the artifacts to the org.

### Adding Custom Query Methods

When extending a generated selector with new query methods, you **MUST** use the `newQueryFactory()` method inherited from the base selector. This is critical for maintaining testability.

-   For queries on the selector's primary SObject, call `newQueryFactory()` with no arguments.
-   For queries on a different SObject (e.g., a related child object), pass the SObject Type to the method, like `newQueryFactory(OtherObject__c.SObjectType)`.

#### Method Signature & Return Type Restrictions

Every custom query method MUST adhere to strict return type guidelines:
1. **Allowed Return Types**: Only `List<SObject>` (or specific lists like `List<MyObject__c>`) and `Database.QueryLocator` are permitted.
2. **No Single SObject Records**: You MUST NOT return a single record (e.g. `MyObject__c`). This is a critical violation of bulkification mandates. Always design methods to handle sets of keys or values and return a list of records.
3. **No Data Transformations**: Selector methods MUST NOT transform SObject data into Map, Set, or other collection types (e.g., converting SObjects into `Map<String, Id>` or `Set<String>`). Returning primitive collections is a major separation-of-concerns anti-pattern. Let the calling Service, Domain, or Action handle all collections and mapping logic.

**Correct Usage:**
```apex
// In a selector for MyObject__c
public List<MyObject__c> selectBySomeCriteria(Set<String> names)
{
    // Correct: Use the factory method from the base class
    return (List<MyObject__c>) Database.query(
        newQueryFactory()
            .setCondition('Name IN :names')
            .toSOQL()
    );
}
```

**Incorrect Usage:**
```apex
// DO NOT do this. It breaks testability.
fflib_QueryFactory qf = new fflib_QueryFactory(this);
// or
fflib_QueryFactory qf = new fflib_QueryFactory(MyObject__c.SObjectType);
```

## Usage

To generate or update a selector with a specific field list:

```bash
node .\skills\manage-apex-selectors\scripts\create_selector.cjs <SObjectName> [AppPrefix] --fields=Id,Name,CustomField__c
```

Example:
```bash
node .\skills\manage-apex-selectors\scripts\create_selector.cjs Account EEORA --fields=Id,Name,AccountNumber,Type
```

## Resources

### assets/
- `SelectorTemplate.cls`: Boilerplate for the Selector class.
- `InterfaceTemplate.cls`: Boilerplate for the Selector interface.
- `TestTemplate.cls`: Boilerplate for the Selector test class.
- `BindingTemplate.xml`: Custom Metadata binding for `ApplicationFactory_SelectorBinding`.
