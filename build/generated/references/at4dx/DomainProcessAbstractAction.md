<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class DomainProcessAbstractAction)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# DomainProcessAbstractAction

**Framework:** at4dx

`public abstract` — implements `IDomainProcessAction`, `IDomainProcessQueueableAction`, `System.Queueable`, `IDomainProcessUnitOfWorkable`

## Properties

- `protected List records`
- `protected IApplicationSObjectUnitOfWork uow`
- `Boolean isActionToRunInQueue`
- `IDomainProcessQueueableAction nextQueueableAction`
- `Boolean isRecordsRequired`
- `System.QueueableContext context`

## Methods

- `public DomainProcessAbstractAction setActionToRunInQueue(Boolean isActionToRunInQueue)`
- `public DomainProcessAbstractAction setNextQueueableActionInChain(IDomainProcessQueueableAction nextQueueableAction)`
- `public DomainProcessAbstractAction setRecordsRequired(Boolean isRecordsRequired)`
- `public IDomainProcessQueueableAction getNextQueuableAction()`
- `public IDomainProcessAction setRecordsToActOn(List records)`
- `public IDomainProcessUnitOfWorkable setUnitOfWork(IApplicationSObjectUnitOfWork uow)`
- `public void run()`
- `public void execute(QueueableContext context)`
- `public abstract void runInProcess()`

