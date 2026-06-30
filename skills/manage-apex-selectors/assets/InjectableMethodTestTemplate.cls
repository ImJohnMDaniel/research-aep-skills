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
        %%TEST_PARAM_ASSIGNMENTS%%

        // 3. Instantiate the injectable method class
        %%METHOD_NAME%%SelectorMethod method = new %%METHOD_NAME%%SelectorMethod();
        method.setQueryFactory(mockQueryFactory);
        method.setParameters(params);

        // 4. Execute the method
        method.selectQuery();

        // 5. Verify: Use the mocking framework to confirm that your query was constructed correctly
        // Example:
        // ((fflib_QueryFactory) mocks.verify(mockQueryFactory, 1))
        //     .setCondition('Id IN :params.recordIds');
    }

    @IsTest
    private static void testPositiveCase() {
        // This test provides a working example of how to invoke the injectable method.
        // It uses a mock response to simulate the query returning data.

        // 1. Setup: Create mock data and mocks
        fflib_ApexMocks mocks = new fflib_ApexMocks();
        %%SELECTOR_INTERFACE_NAME%% mockSelector = (%%SELECTOR_INTERFACE_NAME%%) mocks.mock(%%SELECTOR_INTERFACE_NAME%%.class);
        List<%%SOBJECT_NAME%%> mockResponse = (List<%%SOBJECT_NAME%%>) Test.loadData(%%SOBJECT_NAME%%.SObjectType, 'myStaticResource');

        // 2. Behavior: When 'selectInjection' is called, return the mock response.
        //    Note: fflib_Match.any() is used for the parameters class for simplicity.
        mocks.startStubbing();
        mocks.when(mockSelector.selectInjection(%%METHOD_NAME%%SelectorMethod.class, (ISelectorMethodParameterable)fflib_Match.any(ISelectorMethodParameterable.class)))
            .thenReturn(mockResponse);
        mocks.stopStubbing();

        // 3. Set the mock on the Application factory
        Application.Selector.setMock(mockSelector);

        // 4. Execution: Get the selector INTERFACE and call selectInjection.
        //    This demonstrates the correct, real-world invocation pattern.
        %%METHOD_NAME%%SelectorParams params = new %%METHOD_NAME%%SelectorParams();
        %%TEST_PARAM_ASSIGNMENTS%%
        
        %%SELECTOR_INTERFACE_NAME%% selector = (%%SELECTOR_INTERFACE_NAME%%) Application.Selector.newInstance(%%SOBJECT_NAME%%.SObjectType);
        List<%%SOBJECT_NAME%%> results = (List<%%SOBJECT_NAME%%>) selector.selectInjection(
            %%METHOD_NAME%%SelectorMethod.class,
            params
        );

        // 5. Verify
        System.assertEquals(mockResponse.size(), results.size(), 'The mock response should be returned.');
    }
}
