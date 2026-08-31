<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class ApplicationSObjectUnitOfWork)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# ApplicationSObjectUnitOfWork

**Framework:** at4dx

`public` — extends `fflib_SObjectUnitOfWork`, implements `IApplicationSObjectUnitOfWork`

## Constructors

- `public ApplicationSObjectUnitOfWork(List sObjectTypes)`
- `public ApplicationSObjectUnitOfWork(List sObjectTypes, IDML dml)`

## Properties

- `List<Schema.SObjectType> sObjectTypes`
- `fflib_SObjectUnitOfWork.IDML dml`
- `Schema.SObjectType typeToFind`
- `SObject record`
- `List<SObject> records`
- `Schema.SObjectField relatedToParentField`
- `SObject relatedToParentRecord`
- `List<Messaging.Email> emails`
- `Messaging.Email email`

## Methods

- `public List getNewRecordsByType(Schema.SObjectType typeToFind)`
- `public Map getDirtyRecordsByType(Schema.SObjectType typeToFind)`
- `public Map getDeletedRecordsByType(Schema.SObjectType typeToFind)`
- `public void register(SObject record)`
- `public void register(List records)`
- `public void register(SObject record, Schema.SObjectField relatedToParentField, SObject relatedToParentRecord)`
- `public void registerEmails(List emails)`

