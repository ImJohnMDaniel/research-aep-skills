<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-common @ 485d304 (class fflib_SObjectUnitOfWork)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_SObjectUnitOfWork

**Framework:** fflib-apex-common

`virtual public` — implements `fflib_ISObjectUnitOfWork`

## Constructors

- `public fflib_SObjectUnitOfWork(List sObjectTypes)`
- `public fflib_SObjectUnitOfWork(List sObjectTypes, IDML dml)`

## Properties

- `protected List m_sObjectTypes`
- `protected Map m_newListByType`
- `protected Map m_dirtyMapByType`
- `protected Map m_upsertRecordsPerType`
- `protected Map m_externalIdToUpsertPerType`
- `protected Map m_deletedMapByType`
- `protected Map m_emptyRecycleBinMapByType`
- `protected Map m_relationships`
- `protected Map m_publishBeforeListByType`
- `protected Map m_publishAfterSuccessListByType`
- `protected Map m_publishAfterFailureListByType`
- `protected List m_workList`
- `protected IEmailWork m_emailWork`
- `protected IDML m_dml`
- `List<Schema.SObjectType> sObjectTypes`
- `fflib_SObjectUnitOfWork.IDML dml`
- `Schema.SObjectType sObjectType`
- `Boolean wasSuccessful`
- `String sObjectName`
- `fflib_SObjectUnitOfWork.IDoWork work`
- `Messaging.Email email`
- `SObject record`
- `List<SObject> records`
- `Schema.SObjectField relatedToParentField`
- `SObject relatedToParentRecord`
- `Schema.SObjectField relatedToField`
- `SObject relatedTo`
- `Schema.SObjectField externalIdField`
- `Object externalId`
- `List<Schema.SObjectField> dirtyFields`
- `SObject registeredRecord`
- `Schema.SObjectField dirtyField`
- `String sObjName`
- `Schema.SObjectField registeredExternalId`
- `Schema.DescribeFieldResult fieldDescribe`
- `System.Savepoint sp`
- `String sobjName`
- `List<SObject> upsertRecords`
- `fflib_SObjectUnitOfWork.IDMLUpsertable dmlUpsertable`
- `Integer objectIdx`
- `Map<String,Object> theMap`

## Methods

- `virtual public void onRegisterType(Schema.SObjectType sObjectType)`
- `virtual public void onCommitWorkStarting()`
- `virtual public void onPublishBeforeEventsStarting()`
- `virtual public void onPublishBeforeEventsFinished()`
- `virtual public void onDMLStarting()`
- `virtual public void onDMLFinished()`
- `virtual public void onDoWorkStarting()`
- `virtual public void onDoWorkFinished()`
- `virtual public void onPublishAfterSuccessEventsStarting()`
- `virtual public void onPublishAfterSuccessEventsFinished()`
- `virtual public void onPublishAfterFailureEventsStarting()`
- `virtual public void onPublishAfterFailureEventsFinished()`
- `virtual public void onCommitWorkFinishing()`
- `virtual public void onCommitWorkFinished(Boolean wasSuccessful)`
- `public void registerWork(IDoWork work)`
- `public void registerEmail(Messaging.Email email)`
- `public void registerEmptyRecycleBin(SObject record)`
- `public void registerEmptyRecycleBin(List records)`
- `public void registerNew(SObject record)`
- `public void registerNew(List records)`
- `public void registerNew(SObject record, Schema.SObjectField relatedToParentField, SObject relatedToParentRecord)`
- `public void registerRelationship(SObject record, Schema.SObjectField relatedToField, SObject relatedTo)`
- `public void registerRelationship(Messaging.SingleEmailMessage email, SObject relatedTo)`
- `public void registerRelationship(SObject record, Schema.SObjectField relatedToField, Schema.SObjectField externalIdField, Object externalId)`
- `public void registerDirty(SObject record)`
- `public void registerDirty(List records, List dirtyFields)`
- `public void registerDirty(SObject record, List dirtyFields)`
- `public void registerDirty(SObject record, Schema.SObjectField relatedToParentField, SObject relatedToParentRecord)`
- `public void registerDirty(List records)`
- `public void registerUpsert(SObject record)`
- `public void registerUpsert(List records)`
- `public void registerUpsert(List records, Schema.SObjectField externalIdField)`
- `public void registerUpsert(SObject record, Schema.SObjectField externalIdField, Schema.SObjectField relatedToParentField, SObject relatedToParentRecord)`
- `public void registerDeleted(SObject record)`
- `public void registerDeleted(List records)`
- `public void registerPermanentlyDeleted(List records)`
- `public void registerPermanentlyDeleted(SObject record)`
- `public void registerPublishBeforeTransaction(SObject record)`
- `public void registerPublishBeforeTransaction(List records)`
- `public void registerPublishAfterSuccessTransaction(SObject record)`
- `public void registerPublishAfterSuccessTransaction(List records)`
- `public void registerPublishAfterFailureTransaction(SObject record)`
- `public void registerPublishAfterFailureTransaction(List records)`
- `public void commitWork()`

## Inner Types

### fflib_SObjectUnitOfWork.IDoWork

`public`

#### Methods

- `public abstract void doWork()`

### fflib_SObjectUnitOfWork.IDML

`public`

#### Properties

- `List<SObject> objList`

#### Methods

- `public abstract void dmlInsert(List objList)`
- `public abstract void dmlUpdate(List objList)`
- `public abstract void dmlDelete(List objList)`
- `public abstract void eventPublish(List objList)`
- `public abstract void emptyRecycleBin(List objList)`

### fflib_SObjectUnitOfWork.IDMLUpsertable

`public`

#### Properties

- `List<SObject> objList`
- `Schema.SObjectField externalId`

#### Methods

- `public abstract void dmlUpsert(List objList, Schema.SObjectField externalId)`

### fflib_SObjectUnitOfWork.SimpleDML

`virtual public` — implements `fflib_SObjectUnitOfWork.IDML`, `fflib_SObjectUnitOfWork.IDMLUpsertable`

#### Properties

- `List<SObject> objList`
- `Schema.SObjectField externalId`

#### Methods

- `virtual public void dmlInsert(List objList)`
- `virtual public void dmlUpdate(List objList)`
- `virtual public void dmlUpsert(List objList, Schema.SObjectField externalId)`
- `virtual public void dmlDelete(List objList)`
- `virtual public void eventPublish(List objList)`
- `virtual public void emptyRecycleBin(List objList)`

### fflib_SObjectUnitOfWork.UserModeDML

`virtual public` — extends `fflib_SObjectUnitOfWork.SimpleDML`

#### Constructors

- `public UserModeDML()`
- `public UserModeDML(AccessLevel access)`

#### Properties

- `System.AccessLevel access`
- `List<SObject> objList`
- `Schema.SObjectField externalId`

#### Methods

- `virtual public override void dmlInsert(List objList)`
- `virtual public override void dmlUpdate(List objList)`
- `virtual public override void dmlDelete(List objList)`
- `virtual public override void dmlUpsert(List objList, Schema.SObjectField externalId)`

### fflib_SObjectUnitOfWork.UnitOfWorkException

`public` — extends `Exception`

### fflib_SObjectUnitOfWork.IEmailWork

`public` — implements `fflib_SObjectUnitOfWork.IDoWork`

#### Properties

- `Messaging.Email email`

#### Methods

- `public abstract void registerEmail(Messaging.Email email)`

