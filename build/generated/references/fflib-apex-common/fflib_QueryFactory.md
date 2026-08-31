<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-common @ 485d304 (class fflib_QueryFactory)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_QueryFactory

**Framework:** fflib-apex-common

`public`

## Constructors

- `public fflib_QueryFactory(Schema.SObjectType table)`

## Properties

- `String fieldName`
- `Schema.SObjectType relatedSObjectType`
- `Schema.SObjectField token`
- `List<String> fieldPath`
- `Schema.SObjectType lastSObjectType`
- `System.Iterator<String> i`
- `String field`
- `Schema.DescribeFieldResult tokenDescribe`
- `List<Schema.SObjectType> relatedObjs`
- `Schema.SObjectType sot`
- `Object obj`
- `Schema.SObjectType table`
- `Schema.ChildRelationship relationship`
- `Boolean enforce`
- `fflib_QueryFactory.FLSEnforcement enforcement`
- `Boolean doSort`
- `Schema.SObjectType relatedObjectType`
- `Set<String> fieldNames`
- `System.Iterator<String> iter`
- `Set<Schema.SObjectField> fields`
- `Schema.FieldSet fieldSet`
- `Boolean allowCrossObject`
- `String conditionExpression`
- `Integer limitCount`
- `Integer offsetCount`
- `fflib_QueryFactory.Ordering o`
- `Schema.SObjectType related`
- `Boolean assertIsAccessible`
- `String relationshipName`
- `fflib_QueryFactory subSelectQuery`
- `Schema.SObjectType objType`
- `Schema.ChildRelationship childRow`
- `fflib_QueryFactory.SortOrder direction`
- `Boolean nullsLast`
- `fflib_QueryFactory.Ordering ordr`
- `String result`
- `List<String> fieldsToQuery`
- `fflib_QueryFactory clone`
- `Map<Schema.ChildRelationship,fflib_QueryFactory> subqueries`
- `Map<Schema.ChildRelationship,fflib_QueryFactory> clonedSubqueries`
- `Schema.ChildRelationship key`

## Methods

- `public Boolean equals(Object obj)`
- `public fflib_QueryFactory assertIsAccessible()`
- `public fflib_QueryFactory setEnforceFLS(Boolean enforce)`
- `public fflib_QueryFactory setEnforceFLS(FLSEnforcement enforcement)`
- `public fflib_QueryFactory setSortSelectFields(Boolean doSort)`
- `public fflib_QueryFactory selectField(String fieldName)`
- `public fflib_QueryFactory selectField(String fieldName, Schema.SObjectType relatedObjectType)`
- `public fflib_QueryFactory selectField(Schema.SObjectField field)`
- `public fflib_QueryFactory selectFields(Set fieldNames)`
- `public fflib_QueryFactory selectFields(List fieldNames)`
- `public fflib_QueryFactory selectFields(Set fields)`
- `public fflib_QueryFactory selectFields(List fields)`
- `public fflib_QueryFactory selectFieldSet(Schema.FieldSet fieldSet)`
- `public fflib_QueryFactory selectFieldSet(Schema.FieldSet fieldSet, Boolean allowCrossObject)`
- `public fflib_QueryFactory setCondition(String conditionExpression)`
- `public String getCondition()`
- `public fflib_QueryFactory setLimit(Integer limitCount)`
- `public Integer getLimit()`
- `public fflib_QueryFactory setOffset(Integer offsetCount)`
- `public Integer getOffset()`
- `public fflib_QueryFactory addOrdering(Ordering o)`
- `public fflib_QueryFactory setOrdering(Ordering o)`
- `public List getOrderings()`
- `public Set getSelectedFields()`
- `public fflib_QueryFactory subselectQuery(Schema.SObjectType related)`
- `public fflib_QueryFactory subselectQuery(Schema.SObjectType related, Boolean assertIsAccessible)`
- `public fflib_QueryFactory subselectQuery(String relationshipName)`
- `public fflib_QueryFactory subselectQuery(String relationshipName, Boolean assertIsAccessible)`
- `public fflib_QueryFactory subselectQuery(Schema.ChildRelationship relationship)`
- `public fflib_QueryFactory subselectQuery(Schema.ChildRelationship relationship, Boolean assertIsAccessible)`
- `public List getSubselectQueries()`
- `public fflib_QueryFactory addOrdering(String fieldName, SortOrder direction, Boolean nullsLast)`
- `public fflib_QueryFactory addOrdering(Schema.SObjectField field, SortOrder direction, Boolean nullsLast)`
- `public fflib_QueryFactory addOrdering(String fieldName, SortOrder direction)`
- `public fflib_QueryFactory addOrdering(Schema.SObjectField field, SortOrder direction)`
- `public fflib_QueryFactory setOrdering(String fieldName, SortOrder direction, Boolean nullsLast)`
- `public fflib_QueryFactory setOrdering(Schema.SObjectField field, SortOrder direction, Boolean nullsLast)`
- `public fflib_QueryFactory setOrdering(String fieldName, SortOrder direction)`
- `public fflib_QueryFactory setOrdering(Schema.SObjectField field, SortOrder direction)`
- `public fflib_QueryFactory setAllRows()`
- `public String toSOQL()`
- `public fflib_QueryFactory deepClone()`

## Inner Types

### fflib_QueryFactory.SortOrder

`public`

#### Properties

- `static public final SortOrder ASCENDING`
- `static public final SortOrder DESCENDING`

### fflib_QueryFactory.FLSEnforcement

`public`

#### Properties

- `static public final FLSEnforcement NONE`
- `static public final FLSEnforcement LEGACY`
- `static public final FLSEnforcement USER_MODE`
- `static public final FLSEnforcement SYSTEM_MODE`

### fflib_QueryFactory.Ordering

`public`

#### Constructors

- `public Ordering(String sobjType, String fieldName, SortOrder direction)`
- `public Ordering(Schema.SObjectField field, SortOrder direction)`
- `public Ordering(Schema.SObjectField field, SortOrder direction, Boolean nullsLast)`

#### Properties

- `String sobjType`
- `String fieldName`
- `fflib_QueryFactory.SortOrder direction`
- `Schema.SObjectField field`
- `Boolean nullsLast`

#### Methods

- `public String getField()`
- `public SortOrder getDirection()`
- `public String toSOQL()`

### fflib_QueryFactory.InvalidFieldException

`public` — extends `Exception`

#### Constructors

- `public InvalidFieldException(String fieldName, Schema.SObjectType objectType)`

#### Properties

- `String fieldName`
- `Schema.SObjectType objectType`

### fflib_QueryFactory.InvalidFieldSetException

`public` — extends `Exception`

### fflib_QueryFactory.NonReferenceFieldException

`public` — extends `Exception`

### fflib_QueryFactory.InvalidSubqueryRelationshipException

`public` — extends `Exception`

