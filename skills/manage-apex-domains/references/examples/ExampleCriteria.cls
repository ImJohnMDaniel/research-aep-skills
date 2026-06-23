/**
 * @description Example of a Domain Process Criteria class.
 *              Criteria MUST implement the IDomainProcessCriteria interface.
 *              It is responsible for filtering a list of records and returning
 *              only the records that meet the defined criteria.
 *              This class is used as a reference within the sf-aep-skills extension.
 */
public class ExampleCriteria implements IDomainProcessCriteria {
    private List<SObject> recordsToEvaluate;

    /**
     * @description This method is called by the parent domain to execute the filtering.
     * @return A list of SObjects that meet the criteria.
     */
    public List<SObject> run() {
        List<SObject> recordsThatMeetCriteria = new List<SObject>();
        for (SObject s : this.recordsToEvaluate) {
            Account acct = (Account) s;
            // Add records to the list if they meet the criteria
            if (acct.Industry == 'Technology') {
                recordsThatMeetCriteria.add(acct);
            }
        }
        return recordsThatMeetCriteria;
    }

    /**
     * @description This method is used by the framework to pass in the records
     *              from the trigger context.
     * @param records The list of SObjects to be evaluated.
     * @return The criteria instance, to allow for a builder pattern.
     */
    public IDomainProcessCriteria setRecordsToEvaluate(List<SObject> records) {
        this.recordsToEvaluate = records;
        return this;
    }
}
