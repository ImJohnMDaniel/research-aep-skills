public inherited sharing class {{ClassName}} 
    extends ApplicationSObjectSelector 
    implements {{InterfaceName}} 
{
    public static {{InterfaceName}} newInstance()
    {
        return ({{InterfaceName}}) Application.Selector.newInstance({{SObjectType}}.SObjectType);
    }

    public override List<Schema.SObjectField> getSObjectFieldList()
    {
        return new List<Schema.SObjectField> {
            {{SObjectType}}.Id,
            {{SObjectType}}.Name
            /*
            *   Add additional fields here
            */
        };
    }

    public Schema.SObjectType getSObjectType()
    {
        return {{SObjectType}}.SObjectType;
    }

    public List<{{SObjectType}}> selectById(Set<Id> idSet)
    {
        return (List<{{SObjectType}}>) selectSObjectsById(idSet);
    }

    /*
    *   // =================================================================
    *   //  EXAMPLE: Custom Selector Method
    *   // =================================================================
    *   // When adding custom query methods, use the newQueryFactory()
    *   // method to ensure the selector remains testable.
    *
    *   public List<{{SObjectType}}> selectBySomeCustomCriteria(Set<String> criteria)
    *   {
    *       fflib_QueryFactory queryFactory = newQueryFactory()
    *           .setCondition('Some_Field__c IN :criteria');
    *
    *       return (List<{{SObjectType}}>) Database.query(queryFactory.toSOQL());
    *   }
    */
}
