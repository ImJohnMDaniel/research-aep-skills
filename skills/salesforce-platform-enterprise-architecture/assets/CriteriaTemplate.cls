public with sharing class {{ClassName}} implements IDomainProcessCriteria {
    
    private List<{{SObjectName}}> records;

    public IDomainProcessCriteria setRecordsToEvaluate(List<SObject> records) {
        this.records = (List<{{SObjectName}}>) records;
        return this;
    }

    public List<SObject> run() {
        List<{{SObjectName}}> qualified = new List<{{SObjectName}}>();
        for ({{SObjectName}} record : records) {
            // Apply filtering logic here
            qualified.add(record);
        }
        return qualified;
    }
}
