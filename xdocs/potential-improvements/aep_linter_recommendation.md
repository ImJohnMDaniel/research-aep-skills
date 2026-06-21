# Proposal: Apex Enterprise Patterns (AEP) Linter & Static Analysis Tool

This document outlines the design and implementation strategy for a static analysis tool (linter) to be integrated into the `sf-aep-skills` extension. The primary goal of this tool is to automate architectural governance, ensuring strict compliance with Salesforce Apex Enterprise Patterns (fflib/AT4DX) and preventing common developer/agent anti-patterns.

## 1. Core Objectives
- **Automate Governance**: Enforce architectural standards without relying on manual peer review alone.
- **Prevent Leakage of Concerns**: Keep Selector, Domain, Service, and Action layers strictly isolated.
- **Enforce Performance Best Practices**: Prevent non-bulkified queries and inefficient data processing.

---

## 2. Rules to Enforce

### Rule A: Selector Method Signature Violations (Critical)
- **What to scan for**: Public methods inside classes extending `ApplicationSObjectSelector`.
- **The rule**:
  - **Allowed Return Types**: `List<SObject>` (or specific lists like `List<Account>`) and `Database.QueryLocator`.
  - **Prohibited - Single Records**: Returning a single SObject (e.g. `User` or `Account`) is strictly forbidden. This violates the platform's **bulkification mandate**.
  - **Prohibited - Data Transformations**: Returning primitive collections, Maps of primitives, or Custom Wrapper Classes (e.g., `Set<String>`, `Map<String, Id>`) is strictly forbidden. Selectors must only query and return SObject records. All transformation and mapping logic belongs in the calling Service, Domain, or Action layer.

### Rule B: DML in Selectors (Critical)
- **What to scan for**: Keywords like `insert`, `update`, `upsert`, `delete`, `merge`, or Database DML methods (e.g., `Database.insert`) inside any Selector class.
- **The rule**: Selectors must only read data. Absolutely no DML operations are allowed.

### Rule C: Inline SOQL Queries (Warning)
- **What to scan for**: Inline SOQL statements (e.g., `[SELECT ...]`) in non-Selector classes (such as Controllers, Triggers, or Services).
- **The rule**: To ensure a single source of truth for queries, all SOQL must be refactored into Selector classes.
- *Exception*: Inline SOQL might be permitted in test classes for setup validation, but should still be flagged with a warning.

---

## 3. Implementation Strategies

We propose two viable paths for implementing this linter within the Salesforce ecosystem:

### Option 1: Custom PMD (Apex) Rules (Recommended)
PMD is the industry-standard static analysis tool for Salesforce. It is fast, robust, and already well-understood by most teams.
- **How it works**: Write an XPath-based custom PMD rule within a custom XML ruleset.
- **Example XPath for "Single SObject Return in Selector"**:
  ```xml
  <rule name="NoSingleSObjectReturnInSelector"
        language="apex"
        message="Selector methods must return List<SObject> or Database.QueryLocator to enforce bulkification."
        class="net.sourceforge.pmd.lang.apex.rule.ApexXPathRule">
      <description>Detects non-bulkified single SObject returns inside Selector classes.</description>
      <priority>1</priority>
      <properties>
          <property name="xpath">
              <value><![CDATA[
  //UserClass[@image[endsWith(., 'Selector')]]
  //Method[not(ResultType[@type[endsWith(., 'List') or endsWith(., 'QueryLocator') or endsWith(., 'Map')]])]
              ]]></value>
          </property>
      </properties>
  </rule>
  ```
- **Pros**: Zero-config execution if PMD is already used in the CI/CD pipeline. Very reliable parsing.

### Option 2: Lightweight Node.js Scanner
If PMD is not desired, a lightweight, custom AST/Regex parser can be written in JavaScript and bundled into the `sf-aep-skills` extension.
- **How it works**: A script `scripts/run_aep_linter.cjs` is executed. It reads target Apex files, parses class signatures, and runs regex patterns to validate method return types.
- **Pros**: Easy to customize, direct integration with the CLI agent skills, fast to develop for simple checks.

---

## 4. Workflow Integration Points

To ensure the linter is used effectively, it should be integrated into the following phases of the development lifecycle:

1. **Pre-Deployment / Skill Execution**: Integrate the check into the `manage-apex-selectors` skill script. When the agent attempts to modify or create a selector, the skill runs a validation scan on the generated class. If a violation is found, it blocks deployment and prompts the developer to fix the return type.
2. **Git Pre-Commit Hook**: Use `husky` or `lint-staged` to run the linter against changed Apex classes before a commit is allowed.
3. **CI/CD Pipeline Step**: Include a validation step in the build pipeline (`.gitlab-ci.yml`, `GitHub Actions`, etc.) to run the scan. Any critical rule violation (such as a single-record selector return) will fail the build.
