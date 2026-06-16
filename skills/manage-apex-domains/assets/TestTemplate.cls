@IsTest
private class {{TestClassName}}
{
    @IsTest 
    private static void testNewInstanceMethod()
    {
        // Given
        Id recordId = fflib_IDGenerator.generate( {{SObjectName}}.SObjectType );

        {{SObjectName}} record = new {{SObjectName}}( Id = recordId );

        // When
        Test.startTest();

        {{ClassName}}.newInstance( new List<{{SObjectName}}>{ record } );

        {{ClassName}}.newInstance( new Set<Id>{ recordId } );

        Test.stopTest();

        // Then
    }
}
