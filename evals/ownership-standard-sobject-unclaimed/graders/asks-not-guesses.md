---
type: llm
criteria: >
  The response refuses to create a selector immediately because ownership of the
  standard User SObject is unresolved (the project context file has no AEP
  Conventions section). It asks the developer for the project prefix and for
  which package manages Standard SObjects, and explains that if another package
  owns User the correct approach is Selector Method Injection, never a duplicate
  local selector. It does not invent an owner or a prefix as fact.
focus: restraint and correct ownership reasoning
---
