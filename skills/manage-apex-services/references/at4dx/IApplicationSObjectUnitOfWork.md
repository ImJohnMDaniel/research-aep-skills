<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class IApplicationSObjectUnitOfWork)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# IApplicationSObjectUnitOfWork

**Framework:** at4dx

`public` — implements `fflib_ISObjectUnitOfWork`

## Properties

- `Schema.SObjectType typeToFind`
- `SObject record`
- `List<SObject> records`
- `Schema.SObjectField relatedToParentField`
- `SObject relatedToParentRecord`
- `List<Messaging.Email> emails`

## Methods

- `public abstract List getNewRecordsByType(Schema.SObjectType typeToFind)`
- `public abstract Map getDirtyRecordsByType(Schema.SObjectType typeToFind)`
- `public abstract Map getDeletedRecordsByType(Schema.SObjectType typeToFind)`
- `public abstract void register(SObject record)`
- `public abstract void register(List records)`
- `public abstract void register(SObject record, Schema.SObjectField relatedToParentField, SObject relatedToParentRecord)`
- `public abstract void registerEmails(List emails)`

