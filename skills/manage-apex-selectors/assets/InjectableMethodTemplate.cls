/**
 * @description Injectable selector method to query %%SOBJECT_API_NAME%% records.
**/
public class %%METHOD_NAME%%SelectorMethod
    extends AbstractSelectorMethodInjectable
    implements ISelectorMethodInjectable
{
    /**
     * @description Main query method executed by the framework.
     * @return List<SObject> A list of %%SOBJECT_API_NAME%% records.
    **/
    public List<SObject> selectQuery() {
        // 1. Cast the generic parameters object to your concrete class
        %%METHOD_NAME%%SelectorParams params = (%%METHOD_NAME%%SelectorParams) getParams();
        
        // 2. Add conditions to the query factory based on the parameters
        fflib_QueryFactory queryFactory = newQueryFactory();
            // .setCondition('Id IN :params.recordIds');
            // .setLimit(params.resultLimit);
        
        // 3. Execute and return the query
        return Database.query(queryFactory.toSOQL());
    }
}
