/**
 * @description Example of an Action class that needs access to existing record data.
 *              This is common for "after update" trigger operations.
 *              It MUST extend DomainProcessAbstractAction and implement
 *              the IDomainProcessActionWithExistingRecs interface.
 */
public class ExampleActionWithExistingRecs extends DomainProcessAbstractAction implements IDomainProcessActionWithExistingRecs {
    // This variable will be populated by the setExistingRecords method.
    protected Map<Id, SObject> existingRecords;

    /**
     * @description Core business logic. Called by the abstract class's run() method.
     */
    public override void runInProcess() {
        for(SObject s : this.records){
            SObject oldRecord = this.existingRecords.get(s.Id);
            // Example: Compare old and new records and perform some logic
            // if(oldRecord.get('Status__c') != s.get('Status__c')){
            //    ...
            // }
        }
        System.debug('ExampleActionWithExistingRecs invoked for ' + this.records.size() + ' records.');
    }

    /**
     * @description This method is used by the framework to pass in the records
     *              from the trigger's "oldMap".
     * @param existingRecords A map of the old version of the records.
     * @return The action instance, to allow for a builder pattern.
     */
    public IDomainProcessAction setExistingRecords(Map<Id, SObject> existingRecords) {
        this.existingRecords = existingRecords;
        return this;
    }
}
