/**
 * @description Unit test for the %%METHOD_NAME%%SelectorMethod injectable method.
**/
@IsTest
private class %%METHOD_NAME%%SelectorMethod_UT {
    @IsTest
    private static void testQueryConstruction() {
        // 1. Setup: Create a mock query factory to intercept calls
        fflib_ApexMocks mocks = new fflib_ApexMocks();
        fflib_QueryFactory mockQueryFactory = (fflib_QueryFactory) mocks.mock(fflib_QueryFactory.class);

        // 2. Prepare the parameters that will be passed to the method
        %%METHOD_NAME%%SelectorParams params = new %%METHOD_NAME%%SelectorParams();
        // params.recordIds = new Set<Id>{ fflib_IDGenerator.generate(Account.SObjectType) };

        // 3. Instantiate the injectable method class
        %%METHOD_NAME%%SelectorMethod method = new %%METHOD_NAME%%SelectorMethod();
        method.setQueryFactory(mockQueryFactory);
        method.setParameters(params);

        // 4. Execute the method
        method.selectQuery();

        // 5. Verify: Use the mocking framework to confirm that your query was constructed correctly
        // ((fflib_QueryFactory) mocks.verify(mockQueryFactory, 1))
        //     .setCondition('Id IN :params.recordIds');
    }
}
