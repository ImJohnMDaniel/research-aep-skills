public interface {{InterfaceName}}
{
    /*
    *   Method signatures declare their transaction tier — choose ONE form per
    *   method, matching its role:
    *
    *   Top-tier method (called by service clients; OWNS the transaction
    *   boundary — the implementation creates the Unit of Work and commits):
    *       void doSomething( Set<Id> recordIdSet );
    *
    *   Finer-grained method (participates in the caller's transaction; the
    *   UOW arrives as the LAST parameter; the implementation registers work
    *   and NEVER commits):
    *       void doSomething( Set<Id> recordIdSet, IApplicationSObjectUnitOfWork uow );
    */
}
