public inherited sharing class {{ClassName}} 
    extends ApplicationSObjectSelector 
    implements {{InterfaceName}} 
{
    public static {{InterfaceName}} newInstance()
    {
        return ({{InterfaceName}}) Application.Selector.newInstance({{SObjectType}}.SObjectType);
    }

    public List<Schema.SObjectField> getSObjectFieldList()
    {
        return new List<Schema.SObjectField> {
            {{SObjectType}}.Id,
            {{SObjectType}}.Name
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
}
