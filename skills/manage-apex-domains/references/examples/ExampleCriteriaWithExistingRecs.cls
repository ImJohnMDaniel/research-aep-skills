/**
 * @description Example of a Criteria class that needs access to existing record data.
 *              This is common for "after update" trigger operations.
 *              It MUST implement the IDomainProcessCriteriaWithExistingRecs interface.
 *              This class is used as a reference within the sf-aep-skills extension.
 */
public class ExampleCriteriaWithExistingRecs implements IDomainProcessCriteriaWithExistingRecs {
    private List<SObject> recordsToEvaluate;
    private Map<Id, SObject> existingRecords;

    public List<SObject> run() {
        List<SObject> recordsThatMeetCriteria = new List<SObject>();
        for (SObject s : this.recordsToEvaluate) {
            Account newAcct = (Account) s;
            Account oldAcct = (Account) this.existingRecords.get(s.Id);

            // Example: run only if the account rating changed from Cold to Hot
            if (oldAcct.Rating == 'Cold' && newAcct.Rating == 'Hot') {
                recordsThatMeetCriteria.add(newAcct);
            }
        }
        return recordsThatMeetCriteria;
    }

    public IDomainProcessCriteria setRecordsToEvaluate(List<SObject> records) {
        this.recordsToEvaluate = records;
        return this;
    }

    public IDomainProcessCriteria setExistingRecords(Map<Id, SObject> existingRecords) {
        this.existingRecords = existingRecords;
        return this;
    }
}
