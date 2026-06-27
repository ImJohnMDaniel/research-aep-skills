public inherited sharing class {{ClassName}} 
    extends ApplicationSObjectSelector 
    implements {{InterfaceName}} 
{
    public static {{InterfaceName}} newInstance()
    {
        return ({{InterfaceName}}) Application.Selector.newInstance({{SObjectName}}.SObjectType);
    }

    public override List<Schema.SObjectField> getSObjectFieldList()
    {
        return new List<Schema.SObjectField> {
            {{SObjectFieldList}}
        };
    }

    public Schema.SObjectType getSObjectType()
    {
        return {{SObjectName}}.SObjectType;
    }

    @TestVisible
    private List<Schema.SObjectField> getAdditionalSObjectFieldList() 
    {
        return new List<Schema.SObjectField>{};
    }

    public List<{{SObjectName}}> selectById(Set<Id> idSet)
    {
        return (List<{{SObjectName}}>) selectSObjectsById(idSet);
    }

    /*
    *   // =================================================================
    *   //  EXAMPLE: Custom Selector Method
    *   // =================================================================
    *   // When adding custom query methods, use the newQueryFactory()
    *   // method to ensure the selector remains testable.
    *
    *   public List<{{SObjectName}}> selectBySomeCustomCriteria(Set<String> criteria)
    *   {
    *       fflib_QueryFactory queryFactory = newQueryFactory()
    *           .setCondition('Some_Field__c IN :criteria');
    *
    *       return (List<{{SObjectName}}>) Database.query(queryFactory.toSOQL());
    *   }
    */
}
