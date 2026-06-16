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

1.  **Field List Population**: 
    - Before creating or updating a selector, the agent MUST use the `learn-org-metadata` skill to retrieve the SObject's field list.
    - **Filter**: Exclude all fields with `LongTextArea` or `RichTextArea` data types (`textarea` type with `htmlFormatted: true` or large length) to prevent heap size issues.
    - **Verification**: If the filtered list contains more than **50 fields** AND the selector class is part of the **current project**, the agent MUST verify with the user via `ask_user` if they wish to include all fields. If the selector is part of a **dependency project** (not in the local source), ignore the 50-field verification and include the fields as needed (or as directed).
2.  **Creation / Update**: Generates or surgically updates the Selector class, Interface, and Unit Test.
3.  **Binding**: Creates a custom metadata record in `selectorBindings`.
4.  **Deployment**: Automatically deploys the artifacts to the org.

## Usage

To generate or update a selector with a specific field list:

```bash
node c:\Users\BBIJS1O\workspace\gemini-extensions\sf-aep-skills\skills\manage-apex-selectors\scripts\create_selector.cjs <SObjectName> [AppPrefix] --fields=Id,Name,CustomField__c
```

Example:
```bash
node c:\Users\BBIJS1O\workspace\gemini-extensions\sf-aep-skills\skills\manage-apex-selectors\scripts\create_selector.cjs Account EEORA --fields=Id,Name,AccountNumber,Type
```

## Resources

### assets/
- `SelectorTemplate.cls`: Boilerplate for the Selector class.
- `InterfaceTemplate.cls`: Boilerplate for the Selector interface.
- `TestTemplate.cls`: Boilerplate for the Selector test class.
- `BindingTemplate.xml`: Custom Metadata binding for `ApplicationFactory_SelectorBinding`.
