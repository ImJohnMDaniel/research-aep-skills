---
name: manage-apex-domains
description: Automates the creation or surgical update of a standard Apex Domain layer for a specific SObject following AT4DX patterns. This skill generates/updates the Domain class, interface, trigger, binding record, and test class while preserving existing logic, followed by an automatic deployment to the current Salesforce org.
---

# Manage Apex Domains (AT4DX)

This skill manages the complete "Domain" layer for an SObject, following the AT4DX architectural standard.

## Architectural Mandates

- **Inheritance**: All Domain classes MUST inherit from `ApplicationSObjectDomain`.
- **Interfaces**: All Domains MUST implement a corresponding interface (e.g., `IAccounts`) which extends `IApplicationSObjectDomain`.
- **Factory Registration**: Domains MUST be registered via `ApplicationFactory_DomainBinding` custom metadata to enable Force-DI resolution.
- **Access**: Use the `newInstance()` static methods to access domains via the `Application.Domain` factory.
- **Constructor**: All Domain classes MUST include an inner `Constructor` class implementing `fflib_SObjectDomain.IConstructable`.

## Workflow

1.  **Validation:** Checks if the SObject exists in the local project's metadata.
2.  **Surgical Update / Creation:**
    *   If files don't exist, they are created from templates in the `assets/` folder.
    *   If files exist (Domain, Interface, Trigger, Test), the skill surgically inserts required boilerplate (like `newInstance` methods or `Constructor` inner classes) while **preserving all existing methods and custom logic**.
3.  **Naming:** Applies the `{APP_PREFIX}_{PluralSObject}` convention (40-char limit), handling standard/custom objects appropriately.
4.  **Auto-Deployment:** After files are ready, the skill automatically executes `sf project deploy start` to sync the changes to your default org.

## Usage

To generate or update a domain, run the bundled script:

```bash
node c:\Users\BBIJS1O\workspace\gemini-extensions\sf-aep-skills\skills\manage-apex-domains\scripts\create_domain.cjs <SObjectName> [AppPrefix]
```

Example:
```bash
node c:\Users\BBIJS1O\workspace\gemini-extensions\sf-aep-skills\skills\manage-apex-domains\scripts\create_domain.cjs Account EEORA
```

## Resources

### assets/
- `DomainTemplate.cls`: Boilerplate for the Domain class (inherits `ApplicationSObjectDomain`).
- `InterfaceTemplate.cls`: Boilerplate for the Domain interface.
- `TestTemplate.cls`: Boilerplate for the Domain test class.
- `TriggerTemplate.trigger`: Boilerplate for the SObject trigger.
- `BindingTemplate.xml`: Custom Metadata binding for `ApplicationFactory_DomainBinding`.
