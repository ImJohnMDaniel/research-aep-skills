<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class Application)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# Application

**Framework:** at4dx

`public`

## Properties

- `static public final DomainFactory Domain`
- `static public final SelectorFactory Selector`
- `static public final ServiceFactory Service`
- `static public final UnitOfWorkFactory UnitOfWork`

## Inner Types

### Application.SelectorFactory

`public`

#### Properties

- `Schema.SObjectType sObjectType`
- `Set<Id> recordIds`
- `Schema.SObjectType domainSObjectType`
- `Id recordId`
- `List<SObject> relatedRecords`
- `Schema.SObjectField relationshipField`
- `Set<Id> relatedIds`
- `SObject relatedRecord`
- `Id relatedId`
- `IApplicationSObjectSelector selectorInstance`

#### Methods

- `public IApplicationSObjectSelector newInstance(Schema.SObjectType sObjectType)`
- `public List selectById(Set recordIds)`
- `public List selectByRelationship(List relatedRecords, Schema.SObjectField relationshipField)`

### Application.ServiceFactory

`public`

#### Properties

- `System.Type serviceInterfaceType`
- `Object serviceImpl`

#### Methods

- `public Object newInstance(Type serviceInterfaceType)`

### Application.DomainFactory

`public`

#### Properties

- `Set<Id> recordIds`
- `List<SObject> records`
- `Schema.SObjectType domainSObjectType`
- `Object injector_return`
- `IApplicationSObjectDomain mockDomain`

#### Methods

- `public IApplicationSObjectDomain newInstance(Set recordIds)`
- `public IApplicationSObjectDomain newInstance(List records)`
- `public IApplicationSObjectDomain newInstance(List records, Schema.SObjectType domainSObjectType)`

### Application.UnitOfWorkFactory

`public`

#### Properties

- `List<Schema.SObjectType> objectTypes`
- `fflib_SObjectUnitOfWork.IDML dml`
- `List<Object> params`
- `IApplicationSObjectUnitOfWork mockUow`

#### Methods

- `public IApplicationSObjectUnitOfWork newInstance()`
- `public IApplicationSObjectUnitOfWork newInstance(List objectTypes)`
- `public IApplicationSObjectUnitOfWork newInstance(IDML dml)`
- `public IApplicationSObjectUnitOfWork newInstance(List objectTypes, IDML dml)`

### Application.ApplicationException

`public` — extends `Exception`

### Application.DeveloperException

`public` — extends `Exception`

