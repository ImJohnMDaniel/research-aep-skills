<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class DomainProcessCoordinator)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# DomainProcessCoordinator

**Framework:** at4dx

`public` — implements `IDomainProcessCoordinator`, `di_Binding.Provider`

## Constructors

- `public DomainProcessCoordinator()`
- `public DomainProcessCoordinator(IApplicationSObjectDomain sObjectDomain)`

## Properties

- `List<DomainProcessBinding__mdt> mockDomainProcessBindings`
- `String sobjAPIName`
- `DomainProcessBinding__mdt mockDomainProcessBinding`
- `DomainProcessConstants.PROCESS_CONTEXT processContext`
- `String domainProcessToken`
- `Integer sequence`
- `DomainProcessConstants.PROCESS_TYPE processType`
- `DomainProcessBinding__mdt domainProcess`
- `IApplicationSObjectDomain sObjectDomain`
- `Object params`
- `IApplicationSObjectUnitOfWork uow`
- `System.TriggerOperation triggerOperationType`
- `Map<Id,SObject> existingRecords`
- `Map<Integer,Map<DomainProcessConstants.PROCESS_TYPE,Map<Decimal,DomainProcessBinding__mdt>>> domainProcessesToExecuteMap`
- `List<SObject> qualifiedRecords`
- `List<Integer> sequenceKeysSorted`
- `List<Decimal> orderOfExecutionKeysSorted`
- `System.Type classToInject`
- `IDomainProcessCriteria criteriaClazz`
- `IDomainProcessAction actionClazz`
- `DomainProcessBinding__mdt currentDomainProcess`
- `Integer sequenceKey`
- `Decimal orderOfExecutionKey`
- `List<SObject> criteriaRunResult`
- `SObject currentSObject`
- `Integer i`
- `SObject currentQualifiedRecord`

## Methods

- `public Object newInstance(Object params)`
- `public void processDomainLogicInjections(String domainProcessToken)`
- `public void processDomainLogicInjections(String domainProcessToken, IApplicationSObjectUnitOfWork uow)`
- `public void processDomainLogicInjections(PROCESS_CONTEXT processContext, TriggerOperation triggerOperationType)`
- `public void processDomainLogicInjections(PROCESS_CONTEXT processContext, String domainProcessToken)`
- `public void processDomainLogicInjections(String domainProcessToken, Map existingRecords)`
- `public void processDomainLogicInjections(String domainProcessToken, Map existingRecords, IApplicationSObjectUnitOfWork uow)`
- `public void processDomainLogicInjections(String domainProcessToken, IDomainLogicInjectionsParameterable params, IApplicationSObjectUnitOfWork uow)`
- `public void processDomainLogicInjections(PROCESS_CONTEXT processContext, TriggerOperation triggerOperationType, Map existingRecords)`
- `public void processDomainLogicInjections(PROCESS_CONTEXT processContext, String domainProcessToken, Map existingRecords)`
- `public void processDomainLogicInjections(PROCESS_CONTEXT processContext, String domainProcessToken, Map existingRecords, IApplicationSObjectUnitOfWork uow)`
- `public void processDomainLogicInjections(PROCESS_CONTEXT processContext, String domainProcessToken, Map existingRecords, IDomainLogicInjectionsParameterable params, IApplicationSObjectUnitOfWork uow)`

## Inner Types

### DomainProcessCoordinator.ProcessInjectionException

`public` — extends `Exception`

