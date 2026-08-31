<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class ApplicationSObjectSelector)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# ApplicationSObjectSelector

**Framework:** at4dx

`public abstract` — extends `fflib_SObjectSelector`, implements `IApplicationSObjectSelector`

## Constructors

- `public ApplicationSObjectSelector()`
- `public ApplicationSObjectSelector(Boolean includeFieldSetFields, Boolean enforceCRUD, Boolean enforceFLS)`
- `public ApplicationSObjectSelector(DataAccess dataAccess)`
- `public ApplicationSObjectSelector(Boolean includeFieldSetFields, DataAccess dataAccess)`

## Properties

- `protected List sObjectFieldSetList`
- `Set<String> fieldsToIgnore`
- `String fieldToIgnore`
- `List<Schema.FieldSet> results`
- `Map<String,Schema.FieldSet> fieldSetMap`
- `List<di_Binding> bindings`
- `di_Binding binding`
- `Boolean includeFieldSetFields`
- `Boolean enforceCRUD`
- `Boolean enforceFLS`
- `fflib_SObjectSelector.DataAccess dataAccess`
- `List<Schema.SObjectField> workingFieldList`
- `List<Schema.SObjectField> standardFields`
- `Set<String> ignoredFields`
- `Schema.SObjectField field`
- `Schema.DescribeFieldResult fieldDescribe`
- `fflib_QueryFactory parentQueryFactory`
- `Schema.SObjectField relationshipField`
- `System.Type methodClazzType`
- `ISelectorMethodParameterable params`
- `ISelectorMethodInjectable injectionQueryClazz`
- `ISelectorMethodSetable selectorMethodSetterClazz`
- `ISelectorQueryLocatorMethodInjectable injectionQueryLocatorClazz`

## Methods

- `virtual public Set getStandardSObjectFieldsToIgnore()`
- `virtual public override List getSObjectFieldSetList()`
- `virtual public List getSObjectFieldList()`
- `public IApplicationSObjectSelector addQueryFactoryParentSelect(fflib_QueryFactory parentQueryFactory, Schema.SObjectField relationshipField)`
- `public String selectSObjectsByIdQuery()`
- `public List selectInjection(Type methodClazzType, ISelectorMethodParameterable params)`
- `public Database.QueryLocator selectQueryLocatorInjection(Type methodClazzType, ISelectorMethodParameterable params)`

## Inner Types

### ApplicationSObjectSelector.ApplicationSObjectSelectorException

`public` — extends `Exception`

