@IsTest
private class {{TestClassName}} 
{
    @IsTest
    private static void testSelectById()
    {
        // Given
        Id recordId = fflib_IDGenerator.generate({{SObjectType}}.SObjectType);

        // When
        {{ClassName}}.newInstance().selectById(new Set<Id> { recordId });

        // Then
        // Add assertions as needed
    }
}
