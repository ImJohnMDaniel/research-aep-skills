<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class ApplicationSObjectDomain)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# ApplicationSObjectDomain

**Framework:** at4dx

`public abstract` — extends `fflib_SObjectDomain`, implements `IApplicationSObjectDomain`

## Constructors

- `public ApplicationSObjectDomain(List records)`

## Properties

- `List<SObject> records`
- `Map<Id,SObject> existingRecords`

## Methods

- `public IDomainProcessCoordinator getDomainProcessCoordinator()`
- `virtual public override void handleBeforeInsert()`
- `virtual public override void handleBeforeUpdate(Map existingRecords)`
- `virtual public override void handleBeforeDelete()`
- `virtual public override void handleAfterInsert()`
- `virtual public override void handleAfterUpdate(Map existingRecords)`
- `virtual public override void handleAfterDelete()`
- `virtual public override void handleAfterUndelete()`
- `public Schema.DescribeSObjectResult getSObjectDescribe()`

