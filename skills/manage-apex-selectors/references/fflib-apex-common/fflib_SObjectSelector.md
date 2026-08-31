<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-common @ 485d304 (class fflib_SObjectSelector)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_SObjectSelector

**Framework:** fflib-apex-common

`public abstract with sharing` — implements `fflib_ISObjectSelector`

## Constructors

- `public fflib_SObjectSelector()`
- `public fflib_SObjectSelector(Boolean includeFieldSetFields)`
- `public fflib_SObjectSelector(Boolean includeFieldSetFields, DataAccess dataAccess)`
- `public fflib_SObjectSelector(Boolean includeFieldSetFields, Boolean enforceCRUD, Boolean enforceFLS)`
- `public fflib_SObjectSelector(Boolean includeFieldSetFields, Boolean enforceCRUD, Boolean enforceFLS, Boolean sortSelectFields)`

## Properties

- `Boolean includeFieldSetFields`
- `fflib_SObjectSelector.DataAccess dataAccess`
- `Boolean enforceCRUD`
- `Boolean enforceFLS`
- `Boolean sortSelectFields`
- `Schema.SObjectField nameField`
- `fflib_SObjectSelector.DataAccess access`
- `fflib_StringBuilder.FieldListBuilder fieldListBuilder`
- `String relation`
- `Set<Id> idSet`
- `Boolean includeSelectorFields`
- `Boolean assertCRUD`
- `fflib_QueryFactory queryFactory`
- `String relationshipFieldPath`
- `Schema.SObjectField field`
- `fflib_QueryFactory parentQueryFactory`
- `fflib_QueryFactory subSelectQueryFactory`
- `String relationshipName`
- `fflib_QueryFactory.FLSEnforcement fls`
- `List<Schema.FieldSet> fieldSetList`
- `Schema.FieldSet fieldSet`
- `String orderBy`
- `List<String> orderByParts`
- `String fieldNamePart`
- `String fieldSortOrderPart`
- `fflib_QueryFactory.SortOrder fieldSortOrder`

## Methods

- `virtual public List getSObjectFieldSetList()`
- `virtual public String getOrderBy()`
- `public fflib_SObjectSelector enforceFLS()`
- `public fflib_SObjectSelector includeFieldSetFields()`
- `public fflib_SObjectSelector ignoreCRUD()`
- `public fflib_SObjectSelector unsortedSelectFields()`
- `public fflib_SObjectSelector setDataAccess(DataAccess access)`
- `public Boolean isIncludeFieldSetFields()`
- `public Boolean isEnforcingFLS()`
- `public Boolean isEnforcingCRUD()`
- `public DataAccess getDataAccess()`
- `public CommaDelimitedListBuilder getFieldListBuilder()`
- `public void setFieldListBuilder(FieldListBuilder fieldListBuilder)`
- `public String getFieldListString()`
- `public String getRelatedFieldListString(String relation)`
- `public String getSObjectName()`
- `virtual public List selectSObjectsById(Set idSet)`
- `virtual public Database.QueryLocator queryLocatorById(Set idSet)`
- `public void assertIsAccessible()`
- `public Schema.SObjectType getSObjectType2()`
- `public Schema.SObjectType sObjectType()`
- `public fflib_QueryFactory newQueryFactory()`
- `public fflib_QueryFactory newQueryFactory(Boolean includeSelectorFields)`
- `public fflib_QueryFactory newQueryFactory(Boolean assertCRUD, Boolean enforceFLS, Boolean includeSelectorFields)`
- `public void configureQueryFactoryFields(fflib_QueryFactory queryFactory, String relationshipFieldPath)`
- `public fflib_QueryFactory addQueryFactorySubselect(fflib_QueryFactory parentQueryFactory)`
- `public fflib_QueryFactory addQueryFactorySubselect(fflib_QueryFactory parentQueryFactory, Boolean includeSelectorFields)`
- `public fflib_QueryFactory addQueryFactorySubselect(fflib_QueryFactory parentQueryFactory, String relationshipName)`
- `public fflib_QueryFactory addQueryFactorySubselect(fflib_QueryFactory parentQueryFactory, String relationshipName, Boolean includeSelectorFields)`
- `protected String buildQuerySObjectById()`

## Inner Types

### fflib_SObjectSelector.DataAccess

`public`

#### Properties

- `static public final DataAccess LEGACY`
- `static public final DataAccess USER_MODE`
- `static public final DataAccess SYSTEM_MODE`

