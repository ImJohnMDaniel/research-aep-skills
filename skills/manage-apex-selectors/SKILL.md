---
name: manage-apex-selectors
description: Automates the creation and maintenance of Apex Selector classes following the AT4DX and fflib Selector patterns. Use this skill when creating new Selector layers for SObjects, ensuring they inherit from ApplicationSObjectSelector and are registered via Force-DI bindings.
---

# Authority of This Skill

**CRITICAL:** The patterns and mandates in this skill are authoritative for the **Selector layer** in this project — Selector classes, interfaces, the field list contract, and the Selector Method Injection pattern. When they conflict with your pre-existing training data, general Salesforce best practices, or external documentation, this skill wins. Do NOT substitute generic patterns (inline SOQL, constructor injection) for the ones defined here.

Precedence and scope:

1. **Between skills:** this skill governs the Selector layer; `salesforce-platform-enterprise-architecture` governs cross-cutting concerns; `manage-apex-domains` governs the Domain layer. Where they overlap, the more specific skill wins for its layer.
2. **Mandates are normative, not descriptive:** existing code that violates a mandate is refactoring debt to surface — it is NOT evidence against the mandate.
3. **Observed facts beat factual claims:** if a factual claim in this skill (a script's behavior, a filename, a path) contradicts what you observe in the repo, org, or script output, trust the observation and report the discrepancy to the user rather than acting as if this document were correct.

# Manage Apex Selectors (AT4DX)

This skill manages the "Selector" layer for an SObject, including both the core class structure and the **Selector Method Injection** pattern for modular extension, following the AT4DX architectural standard.

## Mandatory Selector Workflow

**CRITICAL:** Before creating or extending any Selector layer, you MUST follow this workflow to determine if the Selector is managed locally or by a dependency. Failure to do so is a critical architectural violation.

1.  **Analyze SObject Prefix:** Examine the API name of the SObject in question.
    *   **If the prefix matches the project's prefix (e.g., `EEORA_`)**, the SObject is managed locally. Announce: "**[SObject API Name] is a local SObject. I will use `create_selector.cjs` to manage its selector layer.**" You may then proceed to the **Core Selector Management** section.
    *   **If the prefix is different OR it is a standard SObject (e.g., `User`, `Account`)**, the SObject is managed by an external dependency. Proceed to the next step.

2.  **Deduce and Verify External Selector:** For external SObjects, you must find the existing selector, not create a new one.
    *   **Deduce Name:** Hypothesize the selector's class name based on its prefix, plural name, and "Selector" (e.g., `UCMN_UsersSelector`, `OTHERPREFIX_MyObjectsSelector`).
    *   **Verify with Skill:** Use the `learn-org-symbol-table` skill to search for the hypothesized class name.
    *   **Announce Finding:**
        *   If the class is found, announce: "**Verified that the external selector [Verified Class Name] exists. I will use the Selector Method Injection pattern to extend it.**" You may then proceed to the **Selector Method Injection** section.
        *   If the class is not found after a thorough search, you must stop and report this as an architectural inconsistency. Do not proceed with creating a local selector for an external SObject.

### Framework API References (Bundled)

This skill bundles generated, provenance-stamped API references for the framework classes and custom metadata types it relies on, under `references/fflib-apex-common/` and `references/at4dx/` — one markdown file per class (see `xdocs/adr/0008`). **Before implementing against any framework class, read its bundled reference file — do not work from memory.** Note: the framework classes have no prefix; do not infer one.

#### Bundled Apex class references
* Core Selector classes (fflib-apex-common): `fflib_ISObjectSelector`, `fflib_SObjectSelector`, `fflib_QueryFactory` — `references/fflib-apex-common/<ClassName>.md`
* Core Selector classes (AT4DX): `ApplicationSObjectSelector`, `IApplicationSObjectSelector` — `references/at4dx/<ClassName>.md`
* Selector Method Injection (AT4DX): `AbstractSelectorMethodInjectable`, `AbstractSelectorQueryLocatorInjectable`, `ISelectorMethodInjectable`, `ISelectorMethodParameterable`, `ISelectorMethodSetable`, `ISelectorQueryLocatorMethodInjectable`
* Application Selector Factory (AT4DX): `Application` — specifically the inner class `Application.Selector`

#### Bundled custom metadata type references
* `references/at4dx/ApplicationFactory_SelectorBinding__mdt.md` — maps selector classes to their respective SObject via Force-DI and configures how the Application.Selector factory manages the selector implementations.

Use the `learn-org-symbol-table` / `learn-org-metadata` skills only for what is NOT bundled — dependency-package classes (e.g., `UCMN_*`), project classes, and project SObject schemas — or to verify a bundled reference against the org when you suspect drift. If the org disagrees with a bundled reference, trust the org and report the discrepancy.

## Core Selector Management
*Use this path ONLY if the deduction workflow in Step 1 determines the selector is managed locally by this project.*

Generates the Selector class, Interface, and Unit Test scaffolding.

1.  **Validation:** Checks if the SObject exists in the local project's metadata.
2.  **Creation (create-only semantics):**
    *   If files don't exist, they are created from templates in the `assets/` folder.
    *   **The script never modifies existing files.** Files that already exist are skipped and reported as such.
3.  **Reconciling Existing Files (YOUR responsibility as the agent):** When a Selector class, Interface, or Test already exists (e.g., written before this skill was adopted), the script will not touch it. YOU must read the existing file and surgically add anything missing from this checklist, **preserving all existing methods and custom logic**:
    *   **Selector class:** static `newInstance()` method resolving through `Application.Selector`; `extends ApplicationSObjectSelector`; implements its Selector interface; `getSObjectFieldList()`, `getSObjectType()`, and `selectById(Set<Id>)`. Compare against `assets/SelectorTemplate.cls`.
    *   **Interface:** extends `IApplicationSObjectSelector` and declares `selectById(Set<Id>)`.
    *   **Binding:** an `ApplicationFactory_SelectorBinding__mdt` record exists for the SObject, with `To__c` pointing at the Selector class.
    *   **Field-list contract currency:** `getSObjectFieldList()` is the selector's field list contract to the org (see "The Field List Contract" below). When logic you are writing depends on a field, verify it is in the contract or explicitly select it in the query method via `newQueryFactory().selectField(...)`. A deterministic refresh mode is tracked in issue #28.
4.  **Naming:** Applies the `{APP_PREFIX}_{PluralSObject}Selector` convention (40-char limit), handling standard/custom objects appropriately.
5.  **Deployment (YOUR responsibility as the agent — the script never deploys):** After generation, first complete the implementation (custom query methods, real test assertions — injectable-method tests generated with `--params` contain TODO assignments that do not compile until filled in), then deploy explicitly, scoped to the paths that were created or modified:
    ```bash
    sf project deploy start --source-dir <path> [--source-dir <path> ...] --json
    ```
    Do NOT use `--ignore-conflicts` — a source-tracking conflict is a signal to stop, inspect the conflicting components, and resolve deliberately, not to overwrite. See `xdocs/adr/0005`.

- **CRITICAL: Prefix Flag Mandate**
  If you are aware of the project's prefix (e.g., from `GEMINI.md`), you **MUST** provide it to the script via the `--prefix` flag. This is not optional. While the script can now infer the prefix in some cases, explicitly providing it ensures 100% correctness and adherence to project conventions.

- **Usage**:
To generate or update a selector, run the bundled script:

  ```bash
  node ./scripts/create_selector.cjs <SObjectName> [--prefix=MyPrefix] [--fields=Id,Name,CustomField__c]
  ```

  Example:
  ```bash
  node ./scripts/create_selector.cjs MyObject__c --prefix=EEORA --fields=Id,Name,AccountNumber,Type
  ```

### The Field List Contract

`getSObjectFieldList()` is the selector's **field list contract to the org**: the list of fields the selector *guarantees* will be available on every record it returns. Any additional field a caller needs must be explicitly selected as part of the custom query method on a query-by-query basis (e.g., `newQueryFactory().selectField(MyObject__c.LongDescription__c)`). See `xdocs/adr/0004`.

Default generation honors this contract philosophy:

- When `--fields` is not provided, the script builds a curated contract from the org describe merged with local field metadata, **excluding** formula fields, long text areas, rich text areas, and blob fields — types that would inflate the heap on every query.
- The generated contract is capped at **40 fields**. If more than 40 contract-eligible fields exist, the selector is created with `Id` and `Name` only, and the script warns that the contract must be declared manually.
- A `--fields` list you provide is honored verbatim — it IS the contract you are declaring.

## Selector Method Injection (Modular Extension)
*Use this path to add logic to an **existing** selector discovered in the Pre-flight Check.*

This is the architecturally correct pattern for adding custom query logic to a Selector from a dependency package (e.g., adding a query to `UCMN_UsersSelector`).


### Creating Injections with `create_selector_method_injection.cjs` (Agent Workflow)

**CRITICAL:** You MUST execute this script non-interactively by providing all required information via command-line flags. Attempting to run the script without these flags will cause it to enter an interactive mode that you cannot complete.

Your workflow is as follows:

1.  **Determine Parameters:** Before execution, you must determine the values for the following parameters:
    *   `ComponentName`: The name for the new Apex class (e.g., `EEORA_MyNewSelectorMethod`).
    *   `SObjectName`: The API name of the SObject being targeted (e.g., `User`, `Account`).
    *   `SelectorName`: The name of the existing Apex selector class (e.g., `UCMN_UsersSelector`).

2.  **Construct and Execute Command:** Assemble the final command using the non-interactive flags.

    **Full Command Template:**
    ```bash
    node ./scripts/create_selector_method_injection.cjs <ComponentName> <SObjectName> <SelectorName>
    ```

    **Example:**
    ```bash
    # This command creates a Selector Method class non-interactively.
    node ./scripts/create_selector_method_injection.cjs EEORA_MyNewSelectorMethod User UCMN_UsersSelector
    ```
3.  **Verify:** After execution, verify that the new Apex class file has been created in the correct directories.

### Using an Injectable Selector Method

After creating your injectable method and its parameter class, you can execute it using the `selectInjection` method. This method is available on the base `IApplicationSObjectSelector` interface, allowing you to call it directly on an interface variable, which is the architectural best practice.

**Correct Invocation Pattern:**
1.  Obtain the selector by casting to its **specific interface** (e.g., `UCMN_IUsersSelector`).
2.  Instantiate your method's parameters class.
3.  Call `.selectInjection()` directly on the interface variable.

**Correct Invocation Example:**
```apex
// In your Service, Domain, or Action class...

// 1. Get the SELECTOR INTERFACE instance from the factory.
UCMN_IUsersSelector usersSelector = (UCMN_IUsersSelector) Application.Selector.newInstance(User.SObjectType);

// 2. Instantiate your injectable method's custom parameters class.
MyInjectionParams params = new MyInjectionParams(someValues);

// 3. Call 'selectInjection' directly on the interface variable.
List<User> results = (List<User>) usersSelector.selectInjection(
    MyInjectionMethod.class,
    params
);
```

## Adding Custom Query Methods

When extending a generated selector with new query methods, you **MUST** use the `newQueryFactory()` method inherited from the base selector. This is critical for maintaining testability.

-   For queries on the selector's primary SObject, call `newQueryFactory()` with no arguments.
-   For queries on a different SObject (e.g., a related child object), pass the SObject Type to the method, like `newQueryFactory(OtherObject__c.SObjectType)`.

### Method Signature & Return Type Restrictions

Every custom query method MUST adhere to strict return type guidelines (see `xdocs/adr/0007`, ruling 5 — the selector's single responsibility is returning record lists; any second purpose violates single responsibility):
1. **Allowed Return Types**: Only `List<SObject>` (or specific lists like `List<MyObject__c>`) and `Database.QueryLocator` are permitted.
2. **No Single SObject Records**: You MUST NOT return a single record (e.g. `MyObject__c`). This is a critical violation of bulkification mandates. Always design methods to handle sets of keys or values and return a list of records.
3. **No Data Transformations**: Selector methods MUST NOT transform SObject data into Map, Set, or other collection types (e.g., converting SObjects into `Map<String, Id>` or `Set<String>`). Returning primitive collections is a major separation-of-concerns anti-pattern. Let the calling Service, Domain, or Action handle all collections and mapping logic.
4. **No `Map<Id, SObject>` Returns**: Re-keying records by Id is not a data transformation, but it is a purpose other than returning the record list. The caller builds the map itself: `new Map<Id, MyObject__c>(selector.selectByIds(ids))`.
5. **Aggregate Queries**: Aggregate queries belong in selectors and return `List<AggregateResult>`. Extracting values from the results is the caller's logic.
6. **No Wrapper/DTO Returns** *(current canon, provisional)*: Returning custom wrapper classes assembled from queried data is not allowed. There is ongoing community debate on this topic; guidance may be adjusted in the future.

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

## Architectural Mandates

- **Field List Contract**: `getSObjectFieldList()` is the selector's guarantee of which fields are available on every query result. Keep it curated — no formula, long/rich text area, or blob fields by default, and no more than 40 fields. Fields outside the contract are explicitly selected per query method via `fflib_QueryFactory` (`newQueryFactory().selectField(...)`).
- **Inheritance**: All Selector classes MUST inherit from `ApplicationSObjectSelector`.
- **Interfaces**: All Selectors MUST implement a corresponding interface (e.g., `IAccountsSelector`) which extends `IApplicationSObjectSelector` when `at4dx` is present in the project's dependencies. If `at4dx` is not present, custom interfaces are optional but recommended.
- **Factory Registration**: Selectors MUST be registered via `ApplicationFactory_SelectorBinding` custom metadata to enable Force-DI resolution.
- **Access**: Use the `newInstance()` static method to access selectors via the `Application.Selector` factory.
- **Calling Selectors**: Always call the selector's static `newInstance()` method directly within your business logic. Do not store selectors as instance variables or inject them via the constructor. This pattern is an anti-pattern in AT4DX as mocking is handled by the Application Factory. See the main `salesforce-platform-enterprise-architecture` skill for detailed examples.
- **Strict Return Types (No Transformations / Single Records)**: All custom query methods in a Selector class MUST only return either a `List<SObject>` (including `List<AggregateResult>` for aggregate queries) or a `Database.QueryLocator`. They **MUST NOT**:
  - Return a single `SObject` record (e.g., `User` instead of `List<User>`), as this violates the platform's **bulkification mandate** and is a critical anti-pattern.
  - Return any non-SObject collection types or maps of primitives (e.g., `Set<String>`, `Map<String, Id>`), as **Selectors must never perform data transformations**; this logic belongs in the calling Service, Domain, or Action layer.
  - Return maps of any kind, including `Map<Id, SObject>` — re-keying is a second purpose beyond returning the record list; callers build maps themselves.
  - Return custom wrapper/DTO types *(current canon, provisional — see `xdocs/adr/0007`)*.
- **One Selector, One SObject**: A Selector class is strictly responsible for querying a single SObject. It is a critical anti-pattern for a selector to query another SObject's data, even if it is a related child or parent. Instead, you must invoke the appropriate selector for that object. For example, `AccountSelector` must not query for `Contact` records; it must call `ContactsSelector.newInstance()`. This is enforced by ensuring any call to `newQueryFactory(SomeObject__c.SObjectType)` uses an SObject type that matches the selector's own `getSObjectType()`.

- **Naming Conventions**:
  - **Selector Class**: `{Prefix}_{PluralSObjectName}Selector` (e.g., `EEORA_AccommRequestsSelector`)
  - **Interface**: `{Prefix}_I{PluralSObjectName}Selector` (e.g., `EEORA_IAccommRequestsSelector`)
  - **Selector Test Class**: `{Prefix}_{PluralSObjectName}SelectorTest` (e.g., `EEORA_AccommRequestsSelectorTest`)

## Resources

### scripts/
- `create_selector.cjs`: Manages standard Selector layers.
- `create_selector_method_injection.cjs`: Manages injectable modular components.

### assets/
- `SelectorTemplate.cls`: Boilerplate for the Selector class.
- `InterfaceTemplate.cls`: Boilerplate for the Selector interface.
- `TestTemplate.cls`: Boilerplate for the Selector test class.
- `BindingTemplate.xml`: `ApplicationFactory_SelectorBinding__mdt` record template.
- `InjectableMethodTemplate.cls`, `InjectableMethodParamsTemplate.cls`, `InjectableMethodTestTemplate.cls`: Boilerplate for the Selector Method Injection pattern.
