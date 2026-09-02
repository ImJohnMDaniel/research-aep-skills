---
type: llm
criteria: >
  The response recognizes that a managed package's namespaced object carries no
  AEP layers itself, resolves the owner via the Dependencies annotation to the
  docusign-ext (DSX) Third-Party Extension package, and proposes placing or
  extending the query there (e.g., via the DSX selector or Selector Method
  Injection) rather than creating a new ACME-local selector for dsfs__Envelope__c.
focus: namespaced ownership-resolution correctness
---
