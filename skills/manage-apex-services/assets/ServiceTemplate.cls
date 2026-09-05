public inherited sharing class {{ClassName}}
{
    private static {{InterfaceName}} service()
    {
        return ({{InterfaceName}}) Application.Service.newInstance( {{InterfaceName}}.class );
    }

    /*
    *   Facade methods are static and delegate to the factory-resolved
    *   implementation. The signature declares the method's transaction tier —
    *   see the interface for the convention.
    *
    *   public static void doSomething( Set<Id> recordIdSet )
    *   {
    *       service().doSomething( recordIdSet );
    *   }
    */
}
