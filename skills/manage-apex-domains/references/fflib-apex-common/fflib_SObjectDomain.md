<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-common @ 485d304 (class fflib_SObjectDomain)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_SObjectDomain

**Framework:** fflib-apex-common

`virtual public with sharing` — extends `fflib_SObjects`, implements `fflib_ISObjectDomain`

## Constructors

- `public fflib_SObjectDomain(List sObjectList)`
- `public fflib_SObjectDomain(List sObjectList, Schema.SObjectType sObjectType)`

## Properties

- `List<SObject> sObjectList`
- `Schema.SObjectType sObjectType`
- `Map<Id,SObject> existingRecords`
- `Set<String> fieldNames`
- `List<SObject> changedRecords`
- `SObject newRecord`
- `Id recordId`
- `SObject oldRecord`
- `String fieldName`
- `Set<Schema.SObjectField> fieldTokens`
- `Schema.SObjectField fieldToken`
- `System.Type domainClass`
- `List<fflib_SObjectDomain> domains`
- `Boolean isBefore`
- `Boolean isAfter`
- `Boolean isInsert`
- `Boolean isUpdate`
- `Boolean isDelete`
- `Boolean isUndelete`
- `List<SObject> newRecords`
- `Map<Id,SObject> oldRecordsMap`
- `fflib_SObjectDomain domainObject`
- `String domainClassName`
- `System.Type constructableClass`
- `fflib_SObjectDomain.IConstructable domainConstructor`
- `fflib_SObjectDomain domain`
- `List<SObject> records`
- `String message`
- `SObject record`
- `Schema.SObjectField field`

## Methods

- `virtual public void onApplyDefaults()`
- `virtual public void onValidate()`
- `virtual public void onValidate(Map existingRecords)`
- `virtual public void onBeforeInsert()`
- `virtual public void onBeforeUpdate(Map existingRecords)`
- `virtual public void onBeforeDelete()`
- `virtual public void onAfterInsert()`
- `virtual public void onAfterUpdate(Map existingRecords)`
- `virtual public void onAfterDelete()`
- `virtual public void onAfterUndelete()`
- `virtual public void handleBeforeInsert()`
- `virtual public void handleBeforeUpdate(Map existingRecords)`
- `virtual public void handleBeforeDelete()`
- `virtual public void handleAfterInsert()`
- `virtual public void handleAfterUpdate(Map existingRecords)`
- `virtual public void handleAfterDelete()`
- `virtual public void handleAfterUndelete()`
- `public Schema.SObjectType sObjectType()`
- `public List getChangedRecords(Set fieldNames)`
- `public List getChangedRecords(Set fieldTokens)`
- `static public fflib_SObjectDomain getTriggerInstance(Type domainClass)`
- `static public void triggerHandler(Type domainClass)`
- `static public TriggerEvent getTriggerEvent(Type domainClass)`
- `public override String error(String message, SObject record)`
- `public override String error(String message, SObject record, Schema.SObjectField field)`

## Inner Types

### fflib_SObjectDomain.IConstructable

`public`

#### Properties

- `List<SObject> sObjectList`

#### Methods

- `public abstract fflib_SObjectDomain construct(List sObjectList)`

### fflib_SObjectDomain.IConstructable2

`public` — implements `fflib_SObjectDomain.IConstructable`

#### Properties

- `List<SObject> sObjectList`
- `Schema.SObjectType sObjectType`

#### Methods

- `public abstract fflib_SObjectDomain construct(List sObjectList, Schema.SObjectType sObjectType)`

### fflib_SObjectDomain.TriggerEvent

`public`

#### Constructors

- `public TriggerEvent()`

#### Properties

- `Boolean isBefore`
- `Boolean isAfter`
- `Boolean isInsert`
- `Boolean isUpdate`
- `Boolean isDelete`
- `Boolean isUndelete`

#### Methods

- `public TriggerEvent enableBeforeInsert()`
- `public TriggerEvent enableBeforeUpdate()`
- `public TriggerEvent enableBeforeDelete()`
- `public TriggerEvent disableBeforeInsert()`
- `public TriggerEvent disableBeforeUpdate()`
- `public TriggerEvent disableBeforeDelete()`
- `public TriggerEvent enableAfterInsert()`
- `public TriggerEvent enableAfterUpdate()`
- `public TriggerEvent enableAfterDelete()`
- `public TriggerEvent enableAfterUndelete()`
- `public TriggerEvent disableAfterInsert()`
- `public TriggerEvent disableAfterUpdate()`
- `public TriggerEvent disableAfterDelete()`
- `public TriggerEvent disableAfterUndelete()`
- `public TriggerEvent enableAll()`
- `public TriggerEvent disableAll()`
- `public TriggerEvent enableAllBefore()`
- `public TriggerEvent disableAllBefore()`
- `public TriggerEvent enableAllAfter()`
- `public TriggerEvent disableAllAfter()`
- `public Boolean isEnabled(Boolean isBefore, Boolean isAfter, Boolean isInsert, Boolean isUpdate, Boolean isDelete, Boolean isUndelete)`

### fflib_SObjectDomain.Configuration

`public`

#### Constructors

- `public Configuration()`

#### Methods

- `public Configuration enableTriggerState()`
- `public Configuration disableTriggerState()`
- `public Configuration enforceTriggerCRUDSecurity()`
- `public Configuration disableTriggerCRUDSecurity()`
- `public Configuration enableOldOnUpdateValidateBehaviour()`
- `public Configuration disableOldOnUpdateValidateBehaviour()`

### fflib_SObjectDomain.DomainException

`public` — extends `Exception`

### fflib_SObjectDomain.ErrorFactory

`public`

#### Properties

- `String message`
- `SObject record`
- `fflib_SObjectDomain domain`
- `fflib_SObjectDomain.ObjectError objectError`
- `Schema.SObjectField field`
- `fflib_SObjectDomain.FieldError fieldError`

#### Methods

- `public String error(String message, SObject record)`
- `public String error(String message, SObject record, Schema.SObjectField field)`
- `public List getAll()`
- `public void clearAll()`

### fflib_SObjectDomain.FieldError

`virtual public` — extends `fflib_SObjectDomain.ObjectError`

#### Constructors

- `public FieldError()`

#### Properties

- `public Schema.SObjectField field`

### fflib_SObjectDomain.ObjectError

`virtual public` — extends `fflib_SObjectDomain.Error`

#### Constructors

- `public ObjectError()`

#### Properties

- `public SObject record`

### fflib_SObjectDomain.Error

`public abstract`

#### Properties

- `public String message`
- `public fflib_SObjectDomain domain`

### fflib_SObjectDomain.TestFactory

`public`

#### Properties

- `public MockDatabase Database`

### fflib_SObjectDomain.MockDatabase

`public`

#### Properties

- `System.Type domainClass`
- `List<SObject> records`
- `Map<Id,SObject> oldRecords`

#### Methods

- `public void onInsert(List records)`
- `public void onUpdate(List records, Map oldRecords)`
- `public void onDelete(Map records)`
- `public void onUndelete(List records)`
- `public Boolean hasRecords()`

### fflib_SObjectDomain.TestSObjectDomain

`public with sharing` — extends `fflib_SObjectDomain`

#### Constructors

- `public TestSObjectDomain(List sObjectList)`
- `public TestSObjectDomain(List sObjectList, Schema.SObjectType sObjectType)`

#### Properties

- `List<Opportunity> sObjectList`
- `Schema.SObjectType sObjectType`
- `Opportunity opportunity`
- `Opportunity opp`
- `Map<Id,SObject> existingRecords`
- `Opportunity existingOpp`

#### Methods

- `public override void onApplyDefaults()`
- `public override void onValidate()`
- `public override void onValidate(Map existingRecords)`
- `public override void onBeforeDelete()`
- `public override void onAfterUndelete()`
- `public override void onBeforeInsert()`
- `public override void onAfterInsert()`

### fflib_SObjectDomain.TestSObjectDomainConstructor

`public` — implements `fflib_SObjectDomain.IConstructable`

#### Properties

- `List<SObject> sObjectList`

#### Methods

- `public fflib_SObjectDomain construct(List sObjectList)`

### fflib_SObjectDomain.TestSObjectStatefulDomain

`public with sharing` — extends `fflib_SObjectDomain`

#### Constructors

- `public TestSObjectStatefulDomain(List sObjectList)`

#### Properties

- `public String someState`
- `List<Opportunity> sObjectList`
- `List<Opportunity> newOpps`
- `Opportunity opp`

#### Methods

- `public override void onBeforeInsert()`
- `public override void onAfterInsert()`

### fflib_SObjectDomain.TestSObjectStatefulDomainConstructor

`public` — implements `fflib_SObjectDomain.IConstructable`

#### Properties

- `List<SObject> sObjectList`

#### Methods

- `public fflib_SObjectDomain construct(List sObjectList)`

### fflib_SObjectDomain.TestSObjectOnValidateBehaviour

`public with sharing` — extends `fflib_SObjectDomain`

#### Constructors

- `public TestSObjectOnValidateBehaviour(List sObjectList)`

#### Properties

- `List<Opportunity> sObjectList`

#### Methods

- `public override void onValidate()`

### fflib_SObjectDomain.TestSObjectOnValidateBehaviourConstructor

`public` — implements `fflib_SObjectDomain.IConstructable`

#### Properties

- `List<SObject> sObjectList`

#### Methods

- `public fflib_SObjectDomain construct(List sObjectList)`

### fflib_SObjectDomain.TestSObjectChangedRecords

`public with sharing` — extends `fflib_SObjectDomain`

#### Constructors

- `public TestSObjectChangedRecords(List sObjectList)`

#### Properties

- `List<Opportunity> sObjectList`

### fflib_SObjectDomain.TestSObjectChangedRecordsConstructor

`public` — implements `fflib_SObjectDomain.IConstructable`

#### Properties

- `List<SObject> sObjectList`

#### Methods

- `public fflib_SObjectDomain construct(List sObjectList)`

### fflib_SObjectDomain.TestSObjectDisableBehaviour

`public with sharing` — extends `fflib_SObjectDomain`

#### Constructors

- `public TestSObjectDisableBehaviour(List sObjectList)`

#### Properties

- `List<Opportunity> sObjectList`
- `Map<Id,SObject> existing`

#### Methods

- `public override void onAfterInsert()`
- `public override void onBeforeInsert()`
- `public override void onAfterUpdate(Map existing)`
- `public override void onBeforeUpdate(Map existing)`
- `public override void onAfterDelete()`
- `public override void onBeforeDelete()`
- `public override void onAfterUndelete()`

### fflib_SObjectDomain.TestSObjectDisableBehaviourConstructor

`public` — implements `fflib_SObjectDomain.IConstructable`

#### Properties

- `List<SObject> sObjectList`

#### Methods

- `public fflib_SObjectDomain construct(List sObjectList)`

