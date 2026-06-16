public with sharing class {{ClassName}} extends DomainProcessAbstractAction implements IDomainProcessQueueableAction {

    public override void runInProcess() {
        if (records == null || records.isEmpty()) {
            return;
        }

        // Implementation for async action logic
        // This runs in a framework-managed Queueable context
    }
}
