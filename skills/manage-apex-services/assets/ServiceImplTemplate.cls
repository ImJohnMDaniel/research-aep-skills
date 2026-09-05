public inherited sharing class {{ImplClassName}}
    implements {{InterfaceName}}
{
    /*
    *   Top-tier method implementations create and commit the transaction:
    *
    *   public void doSomething( Set<Id> recordIdSet )
    *   {
    *       IApplicationSObjectUnitOfWork uow = Application.UnitOfWork.newInstance();
    *       // ... orchestrate domains, selectors, other services — passing uow
    *       //     to any finer-grained participant ...
    *       uow.commitWork();
    *   }
    *
    *   Finer-grained method implementations register work against the caller's
    *   UOW and never commit:
    *
    *   public void doSomething( Set<Id> recordIdSet, IApplicationSObjectUnitOfWork uow )
    *   {
    *       // ... register records with uow; the transaction owner commits ...
    *   }
    */
}
