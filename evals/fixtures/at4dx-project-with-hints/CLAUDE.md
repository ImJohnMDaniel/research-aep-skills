# ACME App

A Salesforce 2GP unlocked package project.

## AEP Conventions

- Project prefix: ACME
- Standard SObjects are managed by: CMN (common-core package)
- Dependencies:
  - Framework:
    - fflib-apex-common (fflib) @ 3.0.0.LATEST: AEP framework base — covered by bundled tier-1 references
    - fflib-apex-mocks (fflib) @ 2.0.0.LATEST: mocking framework — covered by bundled tier-1 references
    - at4dx (no prefix) @ 1.2.0.LATEST: AEP framework — covered by bundled tier-1 references
  - Universal Common:
    - common-core (CMN) @ 1.4.0.LATEST: standard-SObject layers and shared services
  - Third-Party Extension:
    - docusign-ext (DSX) @ 1.1.0.LATEST: AEP layers (selectors/domains) for DocuSign (dsfs__) objects
  - Third-Party Managed:
    - DocuSign (dsfs__): e-signature
