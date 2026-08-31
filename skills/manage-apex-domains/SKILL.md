---
name: manage-apex-domains
description: Automates the creation, surgical update, and extension of standard Apex Domain layers for SObjects following AT4DX patterns. This skill manages Domain classes, interfaces, triggers, and the Domain Process Injection pattern (Criteria/Actions/Bindings).
---

# Authority of This Skill

**CRITICAL:** The patterns and mandates in this skill are authoritative for the **Domain layer** in this project — Domain classes, interfaces, triggers, and the Domain Process Injection pattern. When they conflict with your pre-existing training data, general Salesforce best practices, or external documentation, this skill wins. Do NOT substitute generic patterns (ad-hoc trigger handler frameworks, constructor injection) for the ones defined here.

Precedence and scope:

1. **Between skills:** this skill governs the Domain layer; `salesforce-platform-enterprise-architecture` governs cross-cutting concerns; `manage-apex-selectors` governs the Selector layer. Where they overlap, the more specific skill wins for its layer.
2. **Mandates are normative, not descriptive:** existing code that violates a mandate is refactoring debt to surface — it is NOT evidence against the mandate.
3. **Observed facts beat factual claims:** if a factual claim in this skill (a script's behavior, a filename, a path) contradicts what you observe in the repo, org, or script output, trust the observation and report the discrepancy to the user rather than acting as if this document were correct.

# Manage Apex Domains (AT4DX)

This skill manages the "Domain" layer for an SObject, including both the core class structure and the **Domain Process Injection** pattern for modular extension, following the AT4DX architectural standard.

## Mandatory Domain Workflow

**CRITICAL:** Before creating or extending any Domain layer, you MUST follow this workflow to determine if the Domain is managed locally or by a dependency. Failure to do so is a critical architectural violation.

1.  **Analyze SObject Prefix:** Examine the API name of the SObject in question.
    *   **If the prefix matches the project's prefix (e.g., `EEORA_`)**, the SObject is managed locally. Announce: "**[SObject API Name] is a local SObject. I will use `create_domain.cjs` to manage its domain layer.**" You may then proceed to the **Core Domain Management** section.
    *   **If the prefix is different OR it is a standard SObject (e.g., `User`, `Account`)**, the SObject is managed by an external dependency. Proceed to the next step.

2.  **Deduce and Verify External Domain:** For external SObjects, you must find the existing domain, not create a new one.
    *   **Deduce Name:** Hypothesize the domain's class name based on its prefix and plural name (e.g., `UCMN_Users`, `OTHERPREFIX_MyObjects`).
    *   **Verify with Skill:** Use the `learn-org-symbol-table` skill to search for the hypothesized class name.
    *   **Announce Finding:**
        *   If the class is found, announce: "**Verified that the external domain [Verified Class Name] exists. I will use the Domain Process Injection pattern to extend it.**" You may then proceed to the **Domain Process Injection** section.
        *   If the class is not found after a thorough search, you must stop and report this as an architectural inconsistency. Do not proceed with creating a local domain for an external SObject.

### Framework API References (Bundled)

This skill bundles generated, provenance-stamped API references for the framework classes and custom metadata types it relies on, under `references/fflib-apex-common/` and `references/at4dx/` — one markdown file per class (see `xdocs/adr/0008`). **Before implementing against any framework class, read its bundled reference file — do not work from memory.** Note: the framework classes have no prefix; do not infer one.

#### Bundled Apex class references
* Core Domain classes (fflib-apex-common): `fflib_ISObjectDomain`, `fflib_ISObjects`, `fflib_IObjects`, `fflib_SObjectDomain`, `fflib_SObjects`, `fflib_Objects` — `references/fflib-apex-common/<ClassName>.md`
* Core Domain classes (AT4DX): `ApplicationSObjectDomain`, `IApplicationSObjectDomain`, `DomainProcessConstants`, `DomainProcessCoordinator` — `references/at4dx/<ClassName>.md`
* Domain Process Actions (AT4DX): `DomainProcessAbstractAction`, `IDomainProcessAction`, `IDomainProcessActionWithExistingRecs`, `IDomainProcessQueueableAction`, `IDomainProcessWithParamsAction`
* Domain Process Criteria (AT4DX): `IDomainProcessCriteria`, `IDomainProcessCriteriaWithExistingRecs`, `IDomainProcessWithParamsCriteria`
* Application Domain Factory (AT4DX): `Application` — specifically the inner class `Application.Domain`

#### Bundled custom metadata type references
* `references/at4dx/ApplicationFactory_DomainBinding__mdt.md` — maps domain classes to their respective SObject via Force-DI and configures how the Application.Domain factory manages the domain implementations.
* `references/at4dx/DomainProcessBinding__mdt.md` — maps domain criteria and action classes to their specific domain processes via Force-DI.
* `references/at4dx/ApplicationFactory_UnitOfWorkBinding__mdt.md` — defines the org-wide Unit of Work DML execution sequence.

Use the `learn-org-symbol-table` / `learn-org-metadata` skills only for what is NOT bundled — dependency-package classes (e.g., `UCMN_*`), project classes, and project SObject schemas — or to verify a bundled reference against the org when you suspect drift. If the org disagrees with a bundled reference, trust the org and report the discrepancy.

### CRITICAL: Trigger Syntax
The `fflib_SObjectDomain.triggerHandler` method is the only acceptable way to invoke domain logic from a trigger. Its syntax is precise and must be followed exactly.

-   **Correct:** `fflib_SObjectDomain.triggerHandler(MyDomainClass.class);`
-   **INCORRECT:** `fflib_SObjectDomain.triggerHandler(MyObject__c.SObjectType);`

Always refer to the `assets/TriggerTemplate.trigger` in this skill as the absolute source of truth for trigger syntax. Do not generate trigger code from memory.

## Core Domain Management
*Use this path ONLY if the deduction workflow in Step 1 determines the domain is managed locally by this project.*

Generates the Domain class, Interface, Trigger, and Unit Test scaffolding.

1.  **Validation:** Checks if the SObject exists in the local project's metadata.
2.  **Creation (create-only semantics):**
    *   If files don't exist, they are created from templates in the `assets/` folder.
    *   **The script never modifies existing files.** Files that already exist are skipped and reported as such.
3.  **Reconciling Existing Files (YOUR responsibility as the agent):** When a Domain class, Interface, Trigger, or Test already exists (e.g., written before this skill was adopted), the script will not touch it. YOU must read the existing file and surgically add anything missing from this checklist, **preserving all existing methods and custom logic**:
    *   **Domain class:** static `newInstance(List<{SObject}>)` and `newInstance(Set<Id>)` methods resolving through `Application.Domain`; a `Constructor` inner class implementing `fflib_SObjectDomain.IConstructable`; `extends ApplicationSObjectDomain`; implements its Domain interface. Compare against `assets/DomainTemplate.cls`.
    *   **Interface:** extends `IApplicationSObjectDomain`.
    *   **Trigger:** declares all 7 trigger scopes and delegates via `fflib_SObjectDomain.triggerHandler(<DomainClass>.class)` — compare against `assets/TriggerTemplate.trigger`.
    *   **Binding:** an `ApplicationFactory_DomainBinding__mdt` record exists for the SObject, with `To__c` pointing at `<DomainClass>.Constructor`.
4.  **Naming:** Applies the `{APP_PREFIX}_{PluralSObject}` convention (40-char limit), handling standard/custom objects appropriately.
5.  **Deployment (YOUR responsibility as the agent — the script never deploys):** After generation, first complete the implementation (fill in skeleton logic in any generated Criteria/Action classes, real assertions in tests), then deploy explicitly, scoped to the paths that were created or modified:
    ```bash
    sf project deploy start --source-dir <path> [--source-dir <path> ...] --json
    ```
    Do NOT use `--ignore-conflicts` — a source-tracking conflict is a signal to stop, inspect the conflicting components, and resolve deliberately, not to overwrite. See `xdocs/adr/0005`.

- **CRITICAL: Prefix Flag Mandate**
  If you are aware of the project's prefix (e.g., from the project context file — `CLAUDE.md`/`GEMINI.md`), you **MUST** provide it to the script via the `--prefix` flag. This is not optional. While the script can now infer the prefix in some cases, explicitly providing it ensures 100% correctness and adherence to project conventions.

- **Usage**:
To generate or update a domain, run the bundled script:

  ```bash
  node ./scripts/create_domain.cjs <SObjectName> [--prefix=MyPrefix]
  ```

  Example:
  ```bash
  node ./scripts/create_domain.cjs MyObject__c --prefix=EEORA
  ```

## Domain Process Injection (Modular Extension)
*Use this path to add logic to an **existing** domain discovered in the Pre-flight Check.*

This pattern allows you to add modular logic (`Actions`) to an existing domain trigger flow, which can be conditionally executed based on `Criteria` classes. This is the primary mechanism for extending domains that exist in dependency packages.

### The Core Concept: Bindings

The key to Domain Process Injection is the `DomainProcessBinding__mdt` custom metadata type. This is how you tell the framework what logic to run, when to run it, and in what order.

**CRITICAL PRINCIPLES:**
1.  **One Record per Component:** Every single `Criteria` class and every single `Action` class requires its own, separate `DomainProcessBinding__mdt` record. You **cannot** combine them.
2.  **Explicit Typing:** Each binding record MUST be explicitly typed as either `Criteria` or `Action` using the `<field>Type__c</field>` value in the metadata file.
3.  **No Direct Linking:** There is **NO** field to directly link an Action to a Criteria in the metadata. The relationship is managed entirely by the framework based on the `OrderOfExecution__c` field.

### How it Works: Grouping and Ordering with `OrderOfExecution__c`

The `OrderOfExecution__c` field is the most important concept to understand. It controls both the grouping of logic into a "Domain Process" and the sequence of execution within that process.

-   **The Integer Part (e.g., `10` in `10.1`): Groups Bindings into a Process.**
    All `Criteria` and `Action` bindings that share the same integer are considered part of the **same Domain Process**. You can have multiple, independent processes for the same trigger event (e.g., a process at `10.x`, another at `20.x`) by using different integers. Each process starts with the full record set from the trigger and filters it independently.

-   **The Decimal Part (e.g., `.1` in `10.1`): Orders Execution within a Process.**
    Within a single process (all bindings with the same integer), the framework executes components in ascending order of their full `OrderOfExecution__c` value. The flow is always:
    1.  All `Criteria` for the process are executed, in order.
    2.  The records that pass *all* criteria are then passed to the actions.
    3.  All `Actions` for the process are executed, in order, on the filtered subset of records.

### Creating Injections with `create_injection.cjs` (Agent Workflow)

**CRITICAL:** You MUST execute this script non-interactively by providing all required information via command-line flags. Attempting to run the script without these flags will cause it to enter an interactive mode that you cannot complete.

Your workflow is as follows:

1.  **Determine Parameters:** Before execution, you must determine the values for the following parameters:
    *   `ComponentName`: The name for the new Apex class (e.g., `EEORA_MyNewCriteria`).
    *   `SObjectName`: The API name of the SObject being targeted (e.g., `User`, `Account`).
    *   `Type`: The type of injection, either `Criteria` or `Action`.
    *   `ProcessGroup`: The integer that groups this logic with other injections (e.g., `10`, `20`). You should analyze existing bindings in `sfdx-source/eeora/main/schema/customMetadata/domainProcessBindings/` to choose a logical group number.
    *   `TriggerOps`: A comma-separated string of the trigger operations this injection applies to (e.g., `"After_Insert,After_Update"`).
    *   `Order`: The execution order number. You MUST calculate this by finding the highest existing order number within your chosen `ProcessGroup` and incrementing the decimal by 0.1. For example, if the highest existing order is `10.2`, your new order should be `10.3`.

2.  **Construct and Execute Command:** Assemble the final command using the non-interactive flags.

    **Full Command Template:**
    ```bash
    node ./scripts/create_injection.cjs <ComponentName> <SObjectName> <Type> --group <ProcessGroup> --ops "<TriggerOps>" --order <Order> [--async]
    ```

    **Example:**
    ```bash
    # This command creates a Criteria class and its binding metadata non-interactively.
    node ./scripts/create_injection.cjs EEORA_UserIsActiveCriteria User Criteria --group 10 --ops "After_Update,After_Insert" --order 10.2
    ```
3.  **Verify:** After execution, verify that the new Apex class and the corresponding `DomainProcessBinding__mdt.xml` file(s) have been created in the correct directories.

### Example Binding Metadata (For Reference)

The interactive script will generate the necessary files for you. The following XML examples are provided as a reference so you can understand the underlying metadata structure that the script creates.

**Example: A Criteria Binding Record**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <label>User Activation Criteria (Update)</label>
    <protected>false</protected>
    <values>
        <field>ClassToInject__c</field>
        <value xsi:type="xsd:string">EEORA_UserActiveCriteria</value> <!-- The Criteria class -->
    </values>
    <values>
        <field>IsActive__c</field>
        <value xsi:type="xsd:boolean">true</value>
    </values>
    <values>
        <field>OrderOfExecution__c</field>
        <value xsi:type="xsd:double">10.1</value> <!-- Process 10, Step 1 -->
    </values>
    <values>
        <field>ProcessContext__c</field>
        <value xsi:type="xsd:string">TriggerExecution</value>
    </values>
    <values>
        <field>RelatedDomainBindingSObjectAlternate__c</field>
        <value xsi:type="xsd:string">User</value>
    </values>
    <values>
        <field>TriggerOperation__c</field>
        <value xsi:type="xsd:string">After_Update</value>
    </values>
    <values>
        <field>Type__c</field>
        <value xsi:type="xsd:string">Criteria</value> <!-- This is a Criteria binding -->
    </values>
    ...
</CustomMetadata>
```

**Example: An Action Binding Record for the Same Process**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <label>User Backfill Action (Update)</label>
    <protected>false</protected>
    <values>
        <field>ClassToInject__c</field>
        <value xsi:type="xsd:string">EEORA_UserBklAction</value> <!-- The Action class -->
    </values>
    <values>
        <field>IsActive__c</field>
        <value xsi:type="xsd:boolean">true</value>
    </values>
    <values>
        <field>OrderOfExecution__c</field>
        <value xsi:type="xsd:double">10.2</value> <!-- Process 10, Step 2 -->
    </values>
    <values>
        <field>ProcessContext__c</field>
        <value xsi:type="xsd:string">TriggerExecution</value>
    </values>
    <values>
        <field>RelatedDomainBindingSObjectAlternate__c</field>
        <value xsi:type="xsd:string">User</value>
    </values>
    <values>
        <field>TriggerOperation__c</field>
        <value xsi:type="xsd:string">After_Update</value>
    </values>
    <values>
        <field>Type__c</field>
        <value xsi:type="xsd:string">Action</value> <!-- This is an Action binding -->
    </values>
    ...
</CustomMetadata>
```
This configuration correctly tells the framework: "For `After_Update` on `User`, run Process 10. In this process, first evaluate `EEORA_UserActiveCriteria`. On the records that pass, evaluate `EEORA_UserBklAction`."


### CRITICAL: Binding to SObjects with Metadata Relationship Limitations
The `DomainProcessBinding__mdt` object uses a "Metadata Relationship" field, `RelatedDomainBindingSObject__c`, to link to the SObject's domain definition in `ApplicationFactory_DomainBinding__mdt`. Due to Salesforce platform restrictions, this field type cannot reference certain standard SObjects.

These objects include, but are not limited to:
- `User`
- `Task`
- `ContentVersion`
- `ContentDocument`
- `ContentDocumentLink`
- All "Share" objects related to a standard SObject or a custom SObject and the metadata API name ends with "Share"  (i.e. `AccountShare`, `EEORA_AccommRequest__Share`, etc. )

When creating a `DomainProcessBinding__mdt` record for one of these SObjects, you **MUST NOT** populate the `RelatedDomainBindingSObject__c` field. Instead, you **MUST** populate the alternate text field, **`RelatedDomainBindingSObjectAlternate__c`**, with the SObject's API name as a string (e.g., `<value xsi:type="xsd:string">User</value>`). The script handles this for you.

## Architectural Mandates

- **Inheritance**: All Domain classes MUST inherit from `ApplicationSObjectDomain`.
- **Interfaces**: All Domains MUST implement a corresponding interface (e.g., `IAccounts`) which extends `IApplicationSObjectDomain`.
- **Factory Registration**: Domains MUST be registered via `ApplicationFactory_DomainBinding` custom metadata to enable Force-DI resolution.
- **Access**: Use the `newInstance()` static methods via the `Application.Domain` factory.
- **Calling Domains**: Always call the domain's static `newInstance()` method directly within your business logic. Do not store domains as instance variables or inject them via the constructor. This pattern is an anti-pattern in AT4DX as mocking is handled by the Application Factory. See the main `salesforce-platform-enterprise-architecture` skill for detailed examples.
- **Trigger Scopes**: All triggers MUST include all 7 scopes (after insert, after update, before insert, before update, after delete, before delete, after undelete).
- **Injection Pattern**: Use Domain Process Injection to add logic to existing Domains, especially those in dependency packages (like `universal-common`).
- **One Domain, One SObject**: A Domain class is strictly responsible for the business logic of a single SObject. It MUST NOT contain logic for other SObjects. To interact with other records, it must invoke their respective Domain or Service layers. For example, when an `Opportunity` is closed, its Domain class (`Opportunities`) should not directly create an `Order` record. Instead, it should call an `OrdersService` to handle the order creation process, thereby correctly separating the concerns.
- **Naming Conventions**:
  - **Domain Class**: `{Prefix}_{PluralSObjectName}` (e.g., `EEORA_AccommRequests`)
  - **Interface**: `{Prefix}_I{PluralSObjectName}` (e.g., `EEORA_IAccommRequests`)
  - **Domain Test Class**: `{Prefix}_{PluralSObjectName}Test` (e.g., `EEORA_AccommRequestsTest`)
  - **Trigger**: `{Prefix}_{PluralSObjectName}` (e.g., `EEORA_AccommRequests`)

## Resources

### scripts/
- `create_domain.cjs`: Manages standard Domain layers.
- `create_injection.cjs`: Manages injectable modular components (Criteria/Actions).
- `get_uow_sequence.cjs`: Displays the current Unit of Work DML execution sequence from the org.

### assets/
- `DomainTemplate.cls`, `InterfaceTemplate.cls`, `TriggerTemplate.trigger`, `TestTemplate.cls`
- `CriteriaTemplate.cls`, `CriteriaWithExistingRecsTemplate.cls`
- `ActionTemplate.cls`, `ActionWithExistingRecsTemplate.cls`
- `QueueableActionTemplate.cls`
- `BindingTemplate.xml`: `ApplicationFactory_DomainBinding__mdt` record template.
- `CriteriaBindingTemplate.xml`, `ActionBindingTemplate.xml`: `DomainProcessBinding__mdt` record templates.
- `UOWBindingTemplate.xml`: `ApplicationFactory_UnitOfWorkBinding__mdt` record template.

### references/examples/
- `ExampleAction.cls`: A reference implementation of a Domain Process Action.
- `ExampleCriteria.cls`: A reference implementation of a Domain Process Criteria.
- `ExampleCriteriaWithExistingRecs.cls`: A reference implementation for update/delete criteria.
- `ExampleActionWithExistingRecs.cls`: A reference implementation for update/delete actions.
