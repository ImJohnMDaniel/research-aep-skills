# Unit of Work Patterns (AT4DX)

The full UOW usage canon (issue #14 ruling trail). The SKILL.md carries the mandates; this reference carries the worked patterns. API signatures live in the bundled references (`fflib_ISObjectUnitOfWork.md`, `fflib_SObjectUnitOfWork.md`, `IApplicationSObjectUnitOfWork.md`, `ApplicationSObjectUnitOfWork.md`).

## Instantiation: the factory's 2×2 matrix

`Application.UnitOfWork` offers four `newInstance` overloads — (SObjectType order: metadata-driven vs. explicit) × (DML strategy: default vs. custom `IDML`):

```apex
Application.UnitOfWork.newInstance();                          // mdt-ordered types, default DML
Application.UnitOfWork.newInstance(myTypes);                   // explicit List<SObjectType>
Application.UnitOfWork.newInstance(new fflib_SObjectUnitOfWork.UserModeDML()); // mdt order, custom IDML
Application.UnitOfWork.newInstance(myTypes, myIdml);           // both explicit
```

The metadata-driven order comes from the org's `ApplicationFactory_UnitOfWorkBinding__mdt` records. Prefer it; explicit type lists are for exceptional, narrow transactions.

### DML mode: prefer user mode where possible

The framework default is `fflib_SObjectUnitOfWork.SimpleDML` (system mode) — a deliberate AEP-maintainers decision preserving **backward compatibility**. The recommendation to developers: **use `UserModeDML` where possible** —

```apex
IApplicationSObjectUnitOfWork uow =
    Application.UnitOfWork.newInstance( new fflib_SObjectUnitOfWork.UserModeDML() );
```

— consistent with the platform's own trajectory (Apex defaulting toward user-mode execution since Summer '26). This is a recommendation, not a mandate: system mode remains legitimate where elevated context is genuinely required. Custom `IDML` implementations are the general seam this mechanism exposes (see `IDoWork` below for its work-sequencing sibling).

## Transaction boundary ownership: the four cases

| Flow | Boundary owner | The UOW |
| --- | --- | --- |
| Service-entry (a service client calls a top-tier service method) | The **outermost service** | Creates it, passes it DOWN to finer-grained services and domain methods, commits at the end |
| Trigger-after context (after insert / after update) | The **domain process/method** may own a **secondary** boundary | Creates and commits its own UOW — no service exists above it in this flow |
| Synchronous Domain Process Action | The **DomainProcessCoordinator** | Injected via `setUnitOfWork(uow)`; the Action registers work and **never** creates or commits |
| Asynchronous Domain Process Action (`ExecuteAsynchronous__c`) | The **framework, automatically** | Each queueable execution is a fresh transaction: `execute(QueueableContext)` creates its own UOW and commits it (see `DomainProcessAbstractAction`) |

**The signature is the contract** (service canon): a method *without* a UOW parameter is top-tier and owns the boundary; a method *with* `IApplicationSObjectUnitOfWork uow` as its (conventionally last) parameter participates in the caller's transaction and never commits. One form per method.

## Registration surface

**Preferred under AT4DX — the smart `register()` family** (dispatches on `Id == null` to new-vs-dirty; mixed lists welcome):

```apex
uow.register( record );                                  // new or dirty, decided per record
uow.register( records );                                 // mixed list
uow.register( child, Child__c.Parent__c, parentRecord ); // with relationship to a (possibly uncommitted) parent
```

**Equally acceptable — the explicit fflib methods** (`registerNew`, `registerDirty`, `registerDeleted`), which are the more **intent-explicit** choice; use them when the intent itself is the documentation (e.g., a method that must only ever insert). `registerRelationship`/the relationship-registering overloads are how children reference parents that do not yet have Ids — which is precisely why the DML sequence must order **parents before children**.

## Pending-work introspection (convenience methods)

`getNewRecordsByType` / `getDirtyRecordsByType` / `getDeletedRecordsByType` expose registered-but-uncommitted work. Use cases:

1. A later Domain Process Action in a sequence **examining/amending records an earlier Action already registered** against the shared UOW, instead of registering duplicates.
2. Unit-test processing and verification steps (inspecting pending work).
3. Ad-hoc examination during development.

Convenience utilities — no mandate attached.

## Platform events: choose the bus by intent

Publication is not a UOW exception — AT4DX provides two buses (envelope on both: `Category__c`, `EventName__c`, `Payload__c`):

- **`AT4DXMessage__e`** (`publishBehavior: PublishAfterCommit`): the transaction-respecting channel — the platform holds delivery until commit; the event dies with a rollback. **Publish it through the UOW, for uniformity:** `uow.registerPublishAfterSuccessTransaction(event)`.
- **`AT4DXImmediateMessage__e`** (`publishBehavior: PublishImmediately`): the sanctioned boundary-**escaping** channel — delivered regardless of the transaction's fate (telemetry, error logging that must survive the rollback it reports). **Publish it directly, mid-transaction:** `EventBus.publish(event)` — never through the UOW, which would defer it to `commitWork` and defeat the immediacy.

(The subscribe side — `PlatformEventDistributor`, `PlatformEvents_Subscription__mdt`, `IEventsConsumer` — is its own capability, addressed separately.)

## Blessed exceptions and the IDoWork seam

"All DML through the UOW" has enumerated exceptions — operations the UOW cannot express:

- `Database.convertLead`
- Approval submissions (`Approval.process`)

For work like this that should still join the transaction's commit sequence, **`fflib_SObjectUnitOfWork.IDoWork` is the extension point**: implement it and `uow.registerWork(myWork)` — custom sequencing not found out of the box, analogous to how `UserModeDML` is the alternative to `SimpleDML`. A framework-provided seam, not a workaround.

## The DML execution sequence

`ApplicationFactory_UnitOfWorkBinding__mdt` does not bind classes — it defines the global, org-wide DML execution order, assembled from records contributed by **every package in the ecosystem**:

- **Ordering principle: parents before children.**
- **Choosing a number:** run `<manage-apex-domains skill>/scripts/get_uow_sequence.cjs` to read the live order from the org (the org is the registry — no sequence map exists anywhere else), then pick a **sensibly-gapped** number. Sample code uses gaps of 10; real-world implementations use hundreds or thousands, preserving insertion room. There is no reserved-range-per-package convention.
- **Standard objects are registered by the package that manages them** (the Single-Ownership Principle extended to sequencing — e.g., a common-core package registers `Account`'s record).
- **Collisions between packages (same number) are a harmless tie**, not an error — and negligible under ecosystem coordination.
- A project-owned custom SObject's binding record is created with its domain (`create_domain.cjs --uow-sequence=<N>`), per the new-SObject full complement.
