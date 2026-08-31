<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-common @ 485d304 (class fflib_Application)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_Application

**Framework:** fflib-apex-common

`virtual public`

## Inner Types

### fflib_Application.UnitOfWorkFactory

`virtual public` — implements `fflib_IUnitOfWorkFactory`

#### Constructors

- `public UnitOfWorkFactory()`
- `public UnitOfWorkFactory(List objectTypes)`

#### Properties

- `protected List m_objectTypes`
- `protected fflib_ISObjectUnitOfWork m_mockUow`
- `List<Schema.SObjectType> objectTypes`
- `fflib_SObjectUnitOfWork.IDML dml`
- `fflib_ISObjectUnitOfWork mockUow`

#### Methods

- `virtual public fflib_ISObjectUnitOfWork newInstance()`
- `virtual public fflib_ISObjectUnitOfWork newInstance(IDML dml)`
- `virtual public fflib_ISObjectUnitOfWork newInstance(List objectTypes)`
- `virtual public fflib_ISObjectUnitOfWork newInstance(List objectTypes, IDML dml)`
- `virtual protected void setMock(fflib_ISObjectUnitOfWork mockUow)`

### fflib_Application.ServiceFactory

`virtual public` — implements `fflib_IServiceFactory`

#### Constructors

- `public ServiceFactory()`
- `public ServiceFactory(Map serviceInterfaceTypeByServiceImplType)`

#### Properties

- `protected Map m_serviceInterfaceTypeByServiceImplType`
- `protected Map m_serviceInterfaceTypeByMockService`
- `Map<System.Type,System.Type> serviceInterfaceTypeByServiceImplType`
- `System.Type serviceInterfaceType`
- `System.Type serviceImpl`

#### Methods

- `virtual public Object newInstance(Type serviceInterfaceType)`
- `virtual protected void setMock(Type serviceInterfaceType, Object serviceImpl)`

### fflib_Application.SelectorFactory

`virtual public` — implements `fflib_ISelectorFactory`

#### Constructors

- `public SelectorFactory()`
- `public SelectorFactory(Map sObjectBySelectorType)`

#### Properties

- `protected Map m_sObjectBySelectorType`
- `protected Map m_sObjectByMockSelector`
- `Map<Schema.SObjectType,System.Type> sObjectBySelectorType`
- `Schema.SObjectType sObjectType`
- `System.Type selectorClass`
- `Set<Id> recordIds`
- `Schema.SObjectType domainSObjectType`
- `Id recordId`
- `List<SObject> relatedRecords`
- `Schema.SObjectField relationshipField`
- `Set<Id> relatedIds`
- `SObject relatedRecord`
- `Id relatedId`
- `fflib_ISObjectSelector selectorInstance`
- `Schema.SObjectType sType`

#### Methods

- `virtual public fflib_ISObjectSelector newInstance(Schema.SObjectType sObjectType)`
- `virtual public List selectById(Set recordIds)`
- `virtual public List selectByRelationship(List relatedRecords, Schema.SObjectField relationshipField)`
- `virtual protected void setMock(fflib_ISObjectSelector selectorInstance)`
- `virtual protected void setMock(Schema.SObjectType sType, fflib_ISObjectSelector selectorInstance)`

### fflib_Application.DomainFactory

`virtual public` — implements `fflib_IDomainFactory`

#### Constructors

- `public DomainFactory()`
- `public DomainFactory(SelectorFactory selectorFactory, Map constructorTypeByObject)`
- `public DomainFactory(SelectorFactory selectorFactory, Map sObjectByDomainConstructorType)`

#### Properties

- `protected SelectorFactory m_selectorFactory`
- `protected Map constructorTypeByObject`
- `protected Map mockDomainByObject`
- `fflib_Application.SelectorFactory selectorFactory`
- `Map<Schema.SObjectType,System.Type> sObjectByDomainConstructorType`
- `Set<Id> recordIds`
- `List<SObject> records`
- `Schema.SObjectType domainSObjectType`
- `List<Object> objects`
- `Object objectType`
- `System.Type domainConstructorClass`
- `Object domainConstructor`
- `fflib_ISObjectDomain mockDomain`
- `Schema.SObjectType sType`
- `Map<Schema.SObjectType,System.Type> constructorTypeBySObjectType`
- `Map<Object,System.Type> result`
- `Schema.SObjectType sObjectType`

#### Methods

- `virtual public fflib_IDomain newInstance(Set recordIds)`
- `virtual public fflib_IDomain newInstance(List records)`
- `virtual public fflib_IDomain newInstance(List objects, Object objectType)`
- `virtual public fflib_IDomain newInstance(List records, Schema.SObjectType domainSObjectType)`
- `virtual protected void setMock(fflib_ISObjectDomain mockDomain)`
- `virtual protected void setMock(Schema.SObjectType sType, fflib_ISObjectDomain mockDomain)`
- `virtual protected void setMock(fflib_IDomain mockDomain)`
- `virtual protected Map getConstructorTypeByObject(Map constructorTypeBySObjectType)`

### fflib_Application.ApplicationException

`public` — extends `Exception`

### fflib_Application.DeveloperException

`public` — extends `Exception`

