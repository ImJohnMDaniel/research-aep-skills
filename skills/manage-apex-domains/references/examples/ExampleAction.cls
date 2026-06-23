/**
 * @description Example of a Domain Process Action class.
 *              It MUST extend DomainProcessAbstractAction and implement IDomainProcessAction.
 *              The business logic is placed in the runInProcess() method.
 *              This class is used as a reference within the sf-aep-skills extension.
 */
public class ExampleAction extends DomainProcessAbstractAction implements IDomainProcessAction {
    /**
     * @description This method is called by the parent abstract class's run() method.
     *              It contains the core business logic for the action.
     */
    public override void runInProcess() {
        // The records to act on are available in the protected 'records' member variable.
        System.debug('ExampleAction was invoked for ' + this.records.size() + ' records.');
        // Example: Enqueue a job with the records that were processed.
        // if(!this.records.isEmpty()){
        //    System.enqueueJob(new MyQueueable(this.records));
        // }
    }
}
