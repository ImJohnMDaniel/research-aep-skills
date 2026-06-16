public inherited sharing class {{ClassName}}
    extends ApplicationSObjectDomain
    implements {{InterfaceName}}
{
    public static {{InterfaceName}} newInstance(List<{{SObjectName}}> records)
    {
        return ({{InterfaceName}}) Application.Domain.newInstance(records);
    }

    public static {{InterfaceName}} newInstance(Set<Id> recordIds)
    {
        return ({{InterfaceName}}) Application.Domain.newInstance(recordIds);
    }

    public {{ClassName}}()
    {
        super( new List<{{SObjectName}}>() );
    }

    public {{ClassName}}(List<{{SObjectName}}> records)
    {
        super(records);
    }

    public class Constructor
        implements fflib_SObjectDomain.IConstructable
    {
        public fflib_SObjectDomain construct(List<SObject> sObjectList)
        { 
            return new {{ClassName}}(sObjectList);
        }
    }
}
