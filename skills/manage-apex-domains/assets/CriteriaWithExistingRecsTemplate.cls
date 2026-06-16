public with sharing class {{ClassName}} implements IDomainProcessCriteriaWithExistingRecs {
    
    private List<{{SObjectName}}> records;
    private Map<Id, {{SObjectName}}> existingRecords;

    public IDomainProcessCriteria setRecordsToEvaluate(List<SObject> records) {
        this.records = (List<{{SObjectName}}>) records;
        return this;
    }

    public IDomainProcessCriteria setExistingRecords(Map<Id, SObject> existingRecords) {
        this.existingRecords = (Map<Id, {{SObjectName}}>) existingRecords;
        return this;
    }

    public List<SObject> run() {
        List<{{SObjectName}}> qualified = new List<{{SObjectName}}>();
        for ({{SObjectName}} record : records) {
            {{SObjectName}} priorRecord = (existingRecords != null) ? existingRecords.get(record.Id) : null;
            
            // Apply filtering logic here (using priorRecord for comparison)
            qualified.add(record);
        }
        return qualified;
    }
}
