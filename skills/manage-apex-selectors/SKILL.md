---
name: manage-apex-selectors
description: Automates the creation and maintenance of Apex Selector classes following the AT4DX and fflib Selector patterns. Use this skill when creating new Selector layers for SObjects, ensuring they inherit from ApplicationSObjectSelector and are registered via Force-DI bindings.
---

# Manage Apex Selectors (AT4DX)

This skill manages the "Selector" layer for an SObject, following the AT4DX architectural standard.

## Architectural Mandates

- **Inheritance**: All Selector classes MUST inherit from `ApplicationSObjectSelector`.
- **Interfaces**: All Selectors MUST implement a corresponding interface (e.g., `IAccountsSelector`) which extends `IApplicationSObjectSelector`.
- **Factory Registration**: Selectors MUST be registered via `ApplicationFactory_SelectorBinding` custom metadata to enable Force-DI resolution.
- **Access**: Use the `newInstance()` static method to access selectors via the `Application.Selector` factory.

## Workflow

**1. SObject Type Analysis (Pre-Check)**

Before proceeding, the agent MUST first analyze the SObject API name:

-   **If the SObject has the project prefix (e.g., `EEORA_MyObject__c`):** Proceed to the next step to create a new, project-specific Selector.
-   **If the SObject is Standard (`User`, `Account`) or from another package (`OtherPrefix__Object__c`):** **STOP.** Do not create a new Selector. The Selector is assumed to exist in a dependency package. Use the `learn-org-symbol-table` skill to discover the API for the existing selector (e.g., `UCMN_AccountsSelector`) and use that in your implementation. This skill should only be used for project-specific SObjects.

1.  **Field List Population**: 
    - Before creating or updating a selector, the agent MUST use the `learn-org-metadata` skill to retrieve the SObject's field list.
    - **Filter**: Exclude all fields with `LongTextArea` or `RichTextArea` data types (`textarea` type with `htmlFormatted: true` or large length) to prevent heap size issues.
    - **Verification**: If the filtered list contains more than **50 fields** AND the selector class is part of the **current project**, the agent MUST verify with the user via `ask_user` if they wish to include all fields. If the selector is part of a **dependency project** (not in the local source), ignore the 50-field verification and include the fields as needed (or as directed).
2.  **Creation / Update**: Generates or surgically updates the Selector class, Interface, and Unit Test.
3.  **Binding**: Creates a custom metadata record in `selectorBindings`.
...
4.  **Deployment**: Automatically deploys the artifacts to the org.

### Adding Custom Query Methods

When extending a generated selector with new query methods, you **MUST** use the `newQueryFactory()` method inherited from the base selector. This is critical for maintaining testability.

-   For queries on the selector's primary SObject, call `newQueryFactory()` with no arguments.
-   For queries on a different SObject (e.g., a related child object), pass the SObject Type to the method, like `newQueryFactory(OtherObject__c.SObjectType)`.

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
