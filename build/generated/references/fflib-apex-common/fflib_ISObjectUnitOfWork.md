<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-common @ 485d304 (class fflib_ISObjectUnitOfWork)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_ISObjectUnitOfWork

**Framework:** fflib-apex-common

`public`

## Properties

- `SObject record`
- `List<SObject> records`
- `Schema.SObjectField relatedToParentField`
- `SObject relatedToParentRecord`
- `Schema.SObjectField relatedToField`
- `SObject relatedTo`
- `Messaging.SingleEmailMessage email`
- `Schema.SObjectField externalIdField`
- `Object externalId`
- `List<Schema.SObjectField> dirtyFields`
- `fflib_SObjectUnitOfWork.IDoWork work`

## Methods

- `public abstract void registerNew(SObject record)`
- `public abstract void registerNew(List records)`
- `public abstract void registerNew(SObject record, Schema.SObjectField relatedToParentField, SObject relatedToParentRecord)`
- `public abstract void registerRelationship(SObject record, Schema.SObjectField relatedToField, SObject relatedTo)`
- `public abstract void registerRelationship(Messaging.SingleEmailMessage email, SObject relatedTo)`
- `public abstract void registerRelationship(SObject record, Schema.SObjectField relatedToField, Schema.SObjectField externalIdField, Object externalId)`
- `public abstract void registerDirty(SObject record)`
- `public abstract void registerDirty(List records, List dirtyFields)`
- `public abstract void registerDirty(SObject record, List dirtyFields)`
- `public abstract void registerDirty(SObject record, Schema.SObjectField relatedToParentField, SObject relatedToParentRecord)`
- `public abstract void registerDirty(List records)`
- `public abstract void registerEmptyRecycleBin(SObject record)`
- `public abstract void registerEmptyRecycleBin(List records)`
- `public abstract void registerUpsert(SObject record)`
- `public abstract void registerUpsert(List records)`
- `public abstract void registerDeleted(SObject record)`
- `public abstract void registerDeleted(List records)`
- `public abstract void registerPermanentlyDeleted(List records)`
- `public abstract void registerPermanentlyDeleted(SObject record)`
- `public abstract void registerPublishBeforeTransaction(SObject record)`
- `public abstract void registerPublishBeforeTransaction(List records)`
- `public abstract void registerPublishAfterSuccessTransaction(SObject record)`
- `public abstract void registerPublishAfterSuccessTransaction(List records)`
- `public abstract void registerPublishAfterFailureTransaction(SObject record)`
- `public abstract void registerPublishAfterFailureTransaction(List records)`
- `public abstract void commitWork()`
- `public abstract void registerWork(IDoWork work)`
- `public abstract void registerEmail(Messaging.Email email)`

