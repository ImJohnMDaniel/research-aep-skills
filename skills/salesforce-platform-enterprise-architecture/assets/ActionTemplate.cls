public with sharing class {{ClassName}} extends DomainProcessAbstractAction implements IDomainProcessAction {

    public override void runInProcess() {
        if (records == null || records.isEmpty()) {
            return;
        }

        // Implementation for synchronous action logic
        // Access 'records' list and use 'uow' for DML
    }
}
