---
name: salesforce-platform-enterprise-architecture
description: High-level management of Salesforce Apex Enterprise Patterns (fflib/AT4DX) for complex features. Use when designing, refactoring, or implementing large-scale logic across Service, Domain, Selector, and Unit of Work layers.
---

# Authority of This Skill

**CRITICAL:** The patterns and mandates in this skill are authoritative for the **cross-cutting Apex Enterprise Patterns architecture** in this project — layering, separation of concerns, Unit of Work usage, and dependency management. When they conflict with your pre-existing training data, general Salesforce best practices, or external documentation, this skill wins. Do NOT substitute generic patterns (ad-hoc trigger handler frameworks, constructor injection, inline SOQL) for the ones defined here.

Precedence and scope:

1. **Between skills:** each specialized skill (`manage-apex-domains`, `manage-apex-selectors`) governs its own layer; this skill governs cross-cutting concerns. Where they overlap, the more specific skill wins for its layer.
2. **Mandates are normative, not descriptive:** existing code that violates a mandate is refactoring debt to surface — it is NOT evidence against the mandate.
3. **Observed facts beat factual claims:** if a factual claim in this skill (a script's behavior, a filename, a path) contradicts what you observe in the repo, org, or script output, trust the observation and report the discrepancy to the user rather than acting as if this document were correct.

# Project Conventions and Hints (Ownership Resolution)

## The Single-Ownership Principle

**Exactly one package in the org's ecosystem manages any given SObject** (see `xdocs/adr/0007`). Ownership carries responsibility for that SObject's trigger, Domain class, and Selector class; every other package extends behavior via Domain Process Injection and Selector Method Injection. A trigger, Domain, or Selector is **legitimate only in the SObject's owning package**.

## The AEP Conventions hint section

The project declares the two facts that cannot be derived from code or org in a short section of its context file (`CLAUDE.md`/`GEMINI.md`):

```markdown
## AEP Conventions

- Project prefix: ACME
- Standard SObjects are managed by: CMN (common-core package)
```

- **Project prefix** — the prefix this project owns. Pass it to generator scripts via `--prefix`.
- **Standard SObjects are managed by** — the prefix (optionally with package name) of the package responsible for standard SObjects. The value may be `this project` for a standalone project that owns them itself, or a mapping when ownership is split (e.g., `User, Task: CMN; Product2: PRICING`).
- **Dependencies** (established and maintained by the `onboard-project` skill; a project may not have this subsection *yet*, but producing it is a REQUIRED step of onboarding — never a skippable one) — the project's dependencies grouped by ecosystem layer (Framework / Universal Common / Org-wide Common / Project Common / Business / Third-Party Extension / Third-Party Managed / Integration), each line carrying the package's prefix, the declared version snapshot, and its purpose — e.g., `- docusign-ext (DSX) @ 1.2.0: AEP layers (selectors/domains) for DocuSign (dsfs__) objects`. Third-Party Extension lines declare which managed-package namespace's AEP layers that extension owns. Framework lines record whether the entry maps to one of the plugin's bundled tier-1 reference sets (the four AEP frameworks, often consumed as renamed private clones — the mapping is developer-confirmed, never assumed from names); every dependency NOT so mapped gets a tier-2 inventory, regardless of layer.

**If the section is missing from the project context file, do not guess.** Ask the developer these two questions, then — with their confirmation — write the `## AEP Conventions` section into the project context file before proceeding.

**Example placeholders:** throughout this skill and its companion skills, `ACME` stands for the project's own prefix and `CMN` for the package that manages Standard SObjects — always meaning *whatever the project context file declares*, never literal names.

## Resolving an SObject's owner

1. **Prefixed SObject:** the prefix names the owner — custom objects are self-describing. Prefix matches the project prefix → this project owns it. Any other prefix → that package owns it.
2. **Namespaced SObject** (a managed package's object, e.g. `dsfs__Envelope__c`): the managed package itself carries no AEP layers. The layers belong to the **designated Third-Party Extension package** for that namespace, per the Dependencies annotations in the AEP Conventions section. Uniquely, the object's own name does NOT identify its AEP-layer owner here — the namespace→extension mapping must be declared. No extension package declared for the namespace → treat as unclaimed (step 4).
3. **Standard SObject:** consult the `Standard SObjects are managed by` hint, then verify the owner's layer actually exists via the `learn-org-symbol-table` skill (deduce `<Prefix>_<PluralName>` / `<Prefix>_<PluralName>Selector`).
4. **Mismatch or silence:** the hint names an owner but discovery finds nothing → report an architectural inconsistency. No hint claims the SObject and discovery finds no owner → ownership is **unclaimed**: stop and ask the developer whether this project should own it (a local trigger/Domain/Selector is then legitimate) or another package will.

# II. The Holistic Refactoring Mandate

When a refactoring or code review task is initiated, the agent **MUST** perform a holistic analysis of the target code and its immediate dependencies to identify **ALL** violations of the architectural mandates outlined in this and associated skills.

### A. The "Upfront Comprehensive Analysis" Rule

At the beginning of any refactoring task, you **MUST** present the user with a comprehensive list of all identified architectural violations. This includes, but is not limited to:
*   Illegitimate Triggers — triggers on SObjects this project does not own (see "Resolving an SObject's owner").
*   Inline SOQL queries outside of a Selector class.
*   Inline DML outside of a Domain or Unit of Work context.
*   Redundant `Queueable` wrapper classes that could be replaced by native asynchronous Actions.
*   Missing `without sharing` on classes that perform sharing calculations.
*   Any other violation of Separation of Concerns.

After presenting the full list, you **MUST** ask the user to confirm the scope of the current task. For example:
> "I have identified the following architectural violations: [List of Violations]. Would you like me to address all of these as part of the current refactoring task, or should I focus only on [Initial Violation] for now?"

### B. The "Persistent Backlog" Rule

If the user chooses to limit the scope of the current task, you **MUST** maintain a "persistent backlog" by creating or updating a file named **`ARCHITECTURAL_DEBT.md`** in the project root.

Upon successful completion of the user's requested, limited-scope task, you **MUST** present the list of remaining violations from the backlog file again and ask for permission to address them. For example:
> "I have successfully refactored the legacy trigger. However, the following architectural violations remain in the `ARCHITECTURAL_DEBT.md` file: [List of Remaining Violations]. Would you like me to proceed with fixing these now?"

At the beginning of any new session, you must check for the existence of `ARCHITECTURAL_DEBT.md` and, if it contains open items, present them to the user for prioritization.

# Salesforce Platform Enterprise Architecture (AT4DX)

This skill provides the architectural framework and procedural guidance for implementing large-scale Salesforce applications using the **Apex Enterprise Patterns** (fflib) and **AT4DX** standards.

When this skill is active, you must analyze and provide recommendations that align with the principles of the Apex Enterprise Patterns. Your first step is to check the project's configuration to tailor your advice.

### **Core Philosophy: Architectural Purity**
This skill and its associated skills (`manage-apex-domains`, `manage-apex-selectors`) MUST enforce and favor **architectural purity** over pragmatic shortcuts or developer convenience. All generated code and recommendations must adhere to the strictest interpretation of the Apex Enterprise Patterns.

**Primary Mandate: One Selector Per SObject**
- Every SObject, without exception, must have its own dedicated Selector class and interface.
- This includes objects that are tightly coupled by a master-detail or lookup relationship, as well as auxiliary objects like `__Share`, `__History`, and `__ChangeEvent`.
- Do NOT combine queries for different SObjects into a single Selector class, even if their relationship is cohesive. For example, queries for `MyObject__c` belong in `MyObjectSelector`, and queries for `MyObject__Share` belong in `MyObjectShareSelector`.

**Primary Mandate: One Domain Per SObject**
- Every SObject, without exception, must have its own dedicated Domain class and interface.
- This includes objects that are tightly coupled by a master-detail or lookup relationship, as well as auxiliary objects like `__Share`, `__History`, and `__ChangeEvent`.
- Do NOT combine business logic for different SObjects into a single Domain class, even if their relationship is cohesive. For example, business logic for `MyObject__c` belongs in `MyObjects` domain class, and business logic for `MyObject__Share` belongs in `MyObjectShares` domain class.

**Primary Mandate: One Trigger Per SObject**
- Every SObject tigger should use only one Apex trigger.  
- Business logic related to Apex trigger/DML operations should be writen into the SObject's Domain class (assuming the SObject is part of the current project) or injected into the SObject's Domain class via **Domain Process Injection**

### **Mandatory Pre-flight Checklist**

Before proposing to modify any Apex code, you MUST perform and explicitly state the results of the following steps in order. This is not optional.

1.  **State Target File:** Announce the full path to the Apex class or trigger you intend to analyze or modify. Read its contents using `read_file`. If the file does not exist or cannot be read, you MUST stop and report the error.

2.  **State API Version:** Read the `sfdx-project.json` file. Announce the `sourceApiVersion` you will use for any new metadata files.

3.  **State Dependencies:** Analyze the class signature from step 1. Announce its parent `extends` class and all `implements` interfaces.

4.  **Announce Verification Plan:** For each non-system dependency identified in step 3 (e.g., anything not from the `System` namespace), you MUST announce your plan to verify it. State: "I will now verify the methods for the following dependencies: [List of Dependencies]".

5.  **Execute Verification:** Use the `learn-org-symbol-table` skill to get the symbol table for each dependency announced in the previous step.

6.  **Confirm Readiness:** After successfully completing all the steps above, you MUST explicitly state: "**Pre-flight checklist complete. All dependencies have been verified.**" You may only proceed with generating a plan or writing code *after* making this confirmation statement.

**E. Mandatory Co-Activation for SObject Logic Analysis**
   - When a task involves analyzing or modifying **Apex Triggers** or SObject business logic, you **MUST** immediately co-activate the `manage-apex-domains` skill.
   - When a task involves analyzing or modifying **SOQL queries** or data access patterns, you **MUST** immediately co-activate the `manage-apex-selectors` skill.

A complete and accurate analysis requires the specialized knowledge from these skills from the very beginning of the task, not just during implementation. This is not optional.

Follow this procedure:
  
   1.  **Verify Project Dependencies:**
       *   Read the `sfdx-project.json` file to check for dependencies on **`fflib-apex-common`** and **`at4dx`**.
  
   2.  **Determine Advisory Path based on Verification:**
  
       *   **PATH A: AT4DX Dependencies ARE PRESENT**
           *   **CRITICAL ARCHITECTURAL MANDATE:** This project uses the strict **AT4DX** framework. All layers (**Service**, **Domain**, and **Selector**) **MUST** be implemented with corresponding interfaces (`IService`, `IDomain`, `ISelector`). This is not optional.
           *   **When creating a Selector, you MUST also create and implement its `I...Selector` interface.**
           *   Refer to `references/at4dx-patterns.md` for the exact implementation details.
           *   Utilize the `manage-apex-selectors` skill to ensure compliance.

       *   **PATH B: Dependencies ARE ABSENT**
           *   The project does not have the fflib libraries installed. Proceed with the user's request by providing **established Salesforce architectural advice** based on the *principles* of the Enterprise Patterns (e.g., Separation of Concerns, Bulkification, Layering).
           *   When you identify a violation of these principles (such as a SOQL query inside a service class), recommend creating a plain Apex class that emulates the correct pattern (e.g., a new `MyObjectSelector` class).
           *   As part of your recommendation, you should frame this as an adjustment to align with best practices and suggest the official libraries as the ideal next step. For example:
               > "To better align with the established architectural principle of Separation of Concerns, I recommend moving this SOQL query into a new, dedicated `YourObjectSelector` class. This is a foundational step in implementing the Selector pattern. For more advanced features and to fully adopt the Apex Enterprise Patterns, the best practice would be to add the `fflib-apex-common` and `at4dx` dependencies. Would you like me to help you create the plain Apex selector class now?"

## Core Architectural Layers

1.  **Service Layer**: Encapsulates business processes and orchestration.
2.  **Domain Layer**: Encapsulates SObject-specific validation, defaults, and business logic. Managed via `manage-apex-domains`.  Apex Triggers should use the SObject's associated Domain class for all busines logic.
3.  **Selector Layer**: Encapsulates SOQL queries, ensuring consistency and security. Managed via `manage-apex-selectors`.
4.  **Unit of Work Layer**: Manages DML operations to ensure they are executed as a single, atomic transaction that can be rolled back on failure. All DML **MUST** be performed using this layer.

    ### Unit of Work Mandates
    There are two distinct and valid contexts for using the Unit of Work. You MUST identify the context you are in and use the correct pattern.

    #### 1. Inside a Domain Process Action
    When your code is inside a class that extends `DomainProcessAbstractAction`, the framework automatically manages the Unit of Work lifecycle for you.
    - The `DomainProcessCoordinator` instantiates a `IApplicationSObjectUnitOfWork` and injects it into your action.
    - You **MUST NOT** create a new Unit of Work instance.
    - You **MUST NOT** call `commitWork()`.
    - Your only responsibility is to register records with the provided instance: `this.uow.registerDirty(record);` or `this.uow.registerNew(record);`.

    #### 2. Inside a Service or Domain Class
    When your code is in a higher-level business logic class (like a Service method) that is NOT part of an automated trigger process, you are responsible for managing the transaction.
    - You **MUST** manually instantiate a `IApplicationSObjectUnitOfWork` Unit of Work instance via `Application.UnitOfWork.newInstance()`.
    - You **MUST** call `uow.commitWork();` at the end of your logic to save the changes to the database.

    ### The DML Execution Sequence
    The `ApplicationFactory_UnitOfWorkBinding__mdt` custom metadata type **DOES NOT** bind Apex classes. Its sole purpose is to define the global, application-wide DML execution order.
    - To prevent runtime errors, any custom SObject that needs to be used in a Unit of Work **MUST** have a corresponding record in this metadata type defining its sequence in the transaction.
    - Use the `get_uow_sequence.cjs` script to view the current order before adding a new binding.
    - The `create_domain.cjs` script will automatically prompt you to create this binding when you create a new Domain for a custom SObject. For non-interactive execution, you can provide the `--uow-sequence=<Number>` flag.

## Architectural Mandates

- **Separation of Concerns**: Never perform DML in Selectors. Never put complex business logic in Triggers.
- **Dependency Injection**: Use the `Application` factory (Force-DI) to instantiate layers.
- **Naming Conventions**: All classes MUST follow the project prefix (e.g., `ACME_`).
- **Interfaces**: All layers MUST be accessed via interfaces to support mock-based unit testing.

### Common Pitfalls & Agent Anti-Patterns

To ensure safe and accurate execution, avoid the following common mistakes:

-   **Anti-Pattern:** Assuming the contents or purpose of a class based on its name.
    -   **Correction:** Always read the file first (`read_file`).
-   **Anti-Pattern:** Ignoring `extends` or `implements` keywords in a class signature.
    -   **Correction:** Always investigate unknown parent classes and interfaces using `learn-org-symbol-table`. Their structure is critical context for your task.
-   **Anti-Pattern:** Proceeding with a plan after a file read operation fails.
    -   **Correction:** A failed read indicates a fundamental misunderstanding of the file system. Stop and debug the path.
-   **Anti-Pattern:** Triggering a full package version creation (`sf package version create`) or package installation to resolve dependency compilation errors during source deployment.
    -   **Correction:** Packaging is a heavyweight, slow operation that is out of scope for local agent tasks and must be managed exclusively by the existing CI/CD system. 
-   **Anti-Pattern:** Refactoring a trigger on an SObject this project does not own (e.g., a `User` trigger when the project context file names another package as the standard-SObjects manager).
    -   **Correction:** A trigger is legitimate only in the SObject's owning package. The correct action is to recommend the trigger's **deletion** and migrate its logic into a Domain Process Injection that hooks into the owning package's trigger infrastructure. Do not attempt to "fix" or "refactor" a trigger that should not exist. If ownership is unclaimed, ask the developer before acting.
-   **Anti-Pattern:** Guessing or assuming the syntax of core framework methods like `fflib_SObjectDomain.triggerHandler`.
    -   **Correction:** Core framework syntax is non-negotiable. The `fflib_SObjectDomain.triggerHandler()` method requires a `System.Type` parameter (e.g., `MyDomain.class`), **NOT** an `SObjectType`. Before generating trigger code, you **MUST** consult the `TriggerTemplate.trigger` asset in the `manage-apex-domains` skill to ensure 100% correct syntax.
-   **Anti-Pattern:** Creating or preserving separate `Queueable` Apex classes that are only called from a Domain Process Action.
    -   **Correction:** The `DomainProcessAbstractAction` class has native, built-in support for asynchronous execution. When you encounter logic that requires asynchronous processing (e.g., to prevent `MIXED_DML` errors), you **MUST** place that logic directly inside the `runInProcess()` method of the `Action` class. You will then set the `<ExecuteAsynchronous__c>true</ExecuteAsynchronous__c>` field in the corresponding `DomainProcessBinding__mdt` record. This eliminates the redundant wrapper class and leverages the framework's built-in capabilities. **Do not create a new `Queueable` class to be called by an `Action`.**
-   **Anti-Pattern:** Performing inline DML operations (`insert`, `update`, `delete`, `undelete`).
    -   **Correction:** All database modifications **MUST** be performed by registering records with a Unit of Work instance (`this.uow` in an Action, or a manually instantiated one in a Service/Domain). Direct DML calls bypass critical framework features like transaction management and are strictly forbidden. Refer to the "Unit of Work Layer" section for implementation details.

### Dependency Resolution and Mocking

**CRITICAL**: Do NOT use constructor injection for factory-managed classes (Services, Domains, Selectors). The AT4DX `Application` factory provides a built-in mechanism for dependency resolution and mocking that makes constructor injection an anti-pattern.

- **Correct Usage**: Always call the static `newInstance()` method directly within the business logic where the dependency is needed.

  ```apex
  // Correct: Inside a service or action method
  public void myBusinessLogic() {
      IAccountsSelector accts = (IAccountsSelector) Application.Selector.newInstance(Account.SObjectType);
      List<Account> records = accts.selectById(someIds);
      // ...
  }
  ```

- **Incorrect Usage**: Avoid storing factory-managed classes as instance variables or injecting them.

  ```apex
  // INCORRECT: Do not do this.
  public class MyService {
      private final IAccountsSelector accts;

      // Anti-pattern: Do not use constructor injection.
      public MyService() {
          this.accts = (IAccountsSelector) Application.Selector.newInstance(Account.SObjectType);
      }

      @TestVisible
      private MyService(IAccountsSelector mockSelector) {
          this.accts = mockSelector;
      }
      // ...
  }
  ```

- **Testing**: To provide a mock implementation in a unit test, use the `Application` factory's `setMock()` method.

  ```apex
  // Correct: In a test method
  @IsTest
  private static void myTest() {
      // 1. Create a mock using fflib-apex-mocks
      fflib_ApexMocks mocks = new fflib_ApexMocks();
      IAccountsSelector mockSelector = (IAccountsSelector) mocks.mock(IAccountsSelector.class);
      
      // 2. Instruct the factory to use the mock
      Application.Selector.setMock(IAccountsSelector.class, mockSelector);

      // 3. When the service calls Application.Selector.newInstance(...), it will receive the mock
      MyService service = new MyService();
      service.myBusinessLogic();

      // ...
  }
  ```


### Ownership of Components Across Packages

A fundamental principle of this architecture is the Single-Ownership Principle (see "Project Conventions and Hints" at the top of this skill): every SObject has exactly one owning package, and only the owner holds its trigger, Domain, and Selector.

-   **This project's SObjects** (prefix matches the project prefix, e.g. `ACME_`): managed directly by this project's skills.
-   **SObjects owned elsewhere** (another package's prefix, or standard SObjects whose declared manager is another package): their Apex Enterprise Pattern layers live in the owning package. Resolve the owner per "Resolving an SObject's owner".

**CRITICAL**: Before creating a new Domain or Selector for an SObject this project does not own, you **MUST** resolve the owner and use the `learn-org-symbol-table` skill to find and utilize the existing component (e.g., `CMN_UsersSelector` from the standard-SObjects manager). Creating a duplicate layer for an SObject owned elsewhere is a critical architectural violation. If ownership is unclaimed, stop and ask the developer.

**CRITICAL WORKFLOW FOR TRIGGERS**: When encountering an Apex Trigger, first resolve the ownership of its SObject. A trigger is legitimate only in the SObject's owning package. If this project does not own the SObject, the trigger is **illegitimate** here — the primary goal is its **removal**, not its refactoring. Migrate its logic into a Domain Process Injection and delete the trigger file. If ownership is unclaimed, ask the developer before acting: a standalone project that owns the SObject may legitimately keep the trigger.

### Selector Discovery Workflow

To efficiently and safely discover dependency selectors (like `CMN_UsersSelector`), you MUST follow this sequence:

1.  **Direct Name Search (Hypothesize)**: First, deduce the most likely selector name based on conventions (e.g., `CMN_` + Plural SObject Name + `Selector`). Use `learn-org-symbol-table` with this exact name.
    ```bash
    # Correct first step
    node ./scripts/learn_symbols.cjs CMN_UsersSelector
    ```
2.  **Targeted Pattern Search (Broaden)**: If the direct search fails, broaden the search *slightly* with a targeted pattern that includes the SObject name.
    ```bash
    # Correct second step if the first fails
    node ./scripts/learn_symbols.cjs --pattern "CMN_*Users*"
    ```
3.  **Broad Pattern Search (Last Resort)**: Only if both targeted searches fail, resort to a broader pattern. This is highly inefficient and should be avoided.
    ```bash
    # Incorrect: Do not do this unless absolutely necessary
    node ./scripts/learn_symbols.cjs --pattern "CMN_*"
    ```

### Extending Dependency Layers: The "Read-Only Class" Problem

A common and critical architectural challenge arises when you need to add a new query method to a Selector owned by another package (e.g., adding a new query to `CMN_UsersSelector`). Because the class is read-only, you cannot modify it directly.

**The Anti-Pattern (DO NOT DO THIS):**
The incorrect solution is to create a second, project-specific selector for the same SObject (e.g., `ACME_UsersSelector`). This violates the Single-Ownership Principle and creates a "split brain" scenario where there are two sources of truth for queries, leading to confusion, code duplication, and maintenance issues.

**The Correct Pattern: Selector Method Injection**
The AT4DX framework provides an elegant solution called **Selector Method Injection**. This pattern allows you to write your custom query logic in a small, separate, "injectable" class within your local project. You can then execute this custom logic *through* the original, unmodified dependency selector.

This maintains the "Single Source of Truth" for the SObject's selector while still allowing safe, project-specific extensions.

**For a detailed guide on how to create and use injectable selector methods, refer to the `manage-apex-selectors` skill.**

## Workflows

### 1. Creating a New Custom SObject (Full Pattern Complement)
Creating a project-owned custom SObject implies immediately establishing its full pattern complement **in the same task** (see `xdocs/adr/0007`, ruling 3) — object creation and layer scaffolding are one unit of work, not a follow-up:

- Run `create_selector.cjs` (from `manage-apex-selectors`): Selector class + interface + unit test + `ApplicationFactory_SelectorBinding__mdt` record.
- Run `create_domain.cjs` (from `manage-apex-domains`): Domain class + interface + unit test + the SObject's trigger + `ApplicationFactory_DomainBinding__mdt` record. Provide `--uow-sequence=<Number>` (run `get_uow_sequence.cjs` first to choose a free number) so the `ApplicationFactory_UnitOfWorkBinding__mdt` record is registered too.
- Then complete the implementations and deploy explicitly (see the specialized skills' Deployment steps).

**Auxiliary objects** (`__Share`, `__History`, `__ChangeEvent`, …) are the exception: create their layers only when the first query or logic for them arises — and always as their own dedicated classes, never folded into the primary SObject's layers.

### 2. Designing a New Feature
- Identify the core SObjects involved (Domains/Selectors).
- Define the business process entry point (Service).
- Map the data flow and transaction boundaries (Unit of Work).

### 3. Refactoring Legacy Code
- Move SOQL from controllers/triggers to **Selectors**.
- Move DML and business logic from triggers to **Domains**.
- Move multi-object orchestration to **Services**.

### 4. Extending Existing Logic (Domain Process Injection)
Use this pattern to add logic to existing Domains owned by other packages (such as the standard-SObjects manager declared in the project context file). Automated tools for this pattern are available in the **`manage-apex-domains`** skill.

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
- **Bundled framework API references** (provenance-stamped, one file per class; see `xdocs/adr/0008`):
  - Unit of Work: `references/fflib-apex-common/fflib_ISObjectUnitOfWork.md`, `fflib_SObjectUnitOfWork.md`; `references/at4dx/IApplicationSObjectUnitOfWork.md`, `ApplicationSObjectUnitOfWork.md`, `ApplicationFactory_UnitOfWorkBinding__mdt.md`
  - Application factories: `references/fflib-apex-common/fflib_Application.md`; `references/at4dx/Application.md`
  - Force-DI: `references/force-di/di_Injector.md`, `di_Binding.md`, `di_Module.md`
  - ApexMocks: `references/fflib-apex-mocks/fflib_ApexMocks.md`, `fflib_Match.md`, `fflib_IDGenerator.md`

  **Read the bundled reference before implementing against a framework class — do not work from memory.** Use `learn-org-symbol-table` only for classes not bundled (dependency-package and project classes) or to verify suspected drift; if the org disagrees with a bundled reference, trust the org and report the discrepancy.
