public with sharing class {{ClassName}} extends DomainProcessAbstractAction implements IDomainProcessActionWithExistingRecs {

    private Map<Id, {{SObjectName}}> existingRecords;

    public IDomainProcessAction setExistingRecords(Map<Id, SObject> existingRecords) {
        this.existingRecords = (Map<Id, {{SObjectName}}>) existingRecords;
        return this;
    }

    public override void runInProcess() {
        if (records == null || records.isEmpty()) {
            return;
        }

        for ({{SObjectName}} record : (List<{{SObjectName}}>) records) {
            {{SObjectName}} priorRecord = (existingRecords != null) ? existingRecords.get(record.Id) : null;
            // Implementation for action logic using record and priorRecord
        }
    }
}
