<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-mocks @ 6889cc0 (class fflib_ApexMocks)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_ApexMocks

**Framework:** fflib-apex-mocks

`public with sharing` — implements `System.StubProvider`

## Constructors

- `public fflib_ApexMocks()`

## Properties

- `static public final Integer NEVER`
- `System.Type classToMock`
- `Object stubbedObject`
- `String stubbedMethodName`
- `System.Type returnType`
- `List<System.Type> listOfParamTypes`
- `List<String> listOfParamNames`
- `List<Object> listOfArgs`
- `Object mockInstance`
- `fflib_VerificationMode verificationMode`
- `Integer times`
- `fflib_InvocationOnMock mockInvocation`
- `Object ignoredRetVal`
- `Exception e`
- `List<Exception> exps`
- `fflib_Answer answer`
- `String methodName`
- `List<System.Type> methodArgTypes`
- `List<Object> methodArgValues`
- `fflib_QualifiedMethod qm`
- `fflib_MethodArgValues argValues`
- `fflib_InvocationOnMock invocation`
- `fflib_MethodReturnValue methotReturnValue`
- `List<Object> unorderedMockInstances`
- `fflib_MethodReturnValue methodReturnValue`
- `Object returnedValue`
- `String customAssertMessage`
- `Integer atLeastTimes`
- `Integer atMostTimes`
- `fflib_InOrder verifyOrderingMode`

## Methods

- `public Object mock(Type classToMock)`
- `public Object handleMethodCall(Object stubbedObject, String stubbedMethodName, Type returnType, List listOfParamTypes, List listOfParamNames, List listOfArgs)`
- `static public String extractTypeName(Object mockInstance)`
- `public Object verify(Object mockInstance)`
- `public Object verify(Object mockInstance, fflib_VerificationMode verificationMode)`
- `public Object verify(Object mockInstance, Integer times)`
- `public void verifyMethodCall(fflib_InvocationOnMock mockInvocation)`
- `public void startStubbing()`
- `public void stopStubbing()`
- `public fflib_MethodReturnValue when(Object ignoredRetVal)`
- `public void recordMethod(fflib_InvocationOnMock mockInvocation)`
- `public List getOrderedMethodCalls()`
- `public fflib_MethodReturnValue prepareMethodReturnValue(fflib_InvocationOnMock mockInvocation)`
- `public fflib_MethodReturnValue getMethodReturnValue(fflib_InvocationOnMock mockInvocation)`
- `public Object doThrowWhen(Exception e, Object mockInstance)`
- `public Object doThrowWhen(List exps, Object mockInstance)`
- `public Object doAnswer(fflib_Answer answer, Object mockInstance)`
- `public void mockVoidMethod(Object mockInstance, String methodName, List methodArgTypes, List methodArgValues)`
- `public Object mockNonVoidMethod(Object mockInstance, String methodName, List methodArgTypes, List methodArgValues)`
- `public fflib_InOrder inOrder(List unorderedMockInstances)`
- `public fflib_VerificationMode times(Integer times)`
- `public fflib_VerificationMode calls(Integer times)`
- `public fflib_VerificationMode description(String customAssertMessage)`
- `public fflib_VerificationMode atLeast(Integer atLeastTimes)`
- `public fflib_VerificationMode atMost(Integer atMostTimes)`
- `public fflib_VerificationMode atLeastOnce()`
- `public fflib_VerificationMode between(Integer atLeastTimes, Integer atMostTimes)`
- `public fflib_VerificationMode never()`
- `public void setOrderedVerifier(fflib_InOrder verifyOrderingMode)`
- `public override String toString()`

## Inner Types

### fflib_ApexMocks.ApexMocksException

`public` — extends `Exception`

