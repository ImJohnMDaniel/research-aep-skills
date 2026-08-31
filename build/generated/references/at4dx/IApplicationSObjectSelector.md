<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (class IApplicationSObjectSelector)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# IApplicationSObjectSelector

**Framework:** at4dx

`public` — implements `fflib_ISObjectSelector`

## Properties

- `System.Type methodClazz`
- `ISelectorMethodParameterable params`
- `System.Type methodClazzType`
- `fflib_QueryFactory queryFactory`
- `String relationshipFieldPath`
- `fflib_QueryFactory parentQueryFactory`

## Methods

- `public abstract String selectSObjectsByIdQuery()`
- `public abstract List selectInjection(Type methodClazz, ISelectorMethodParameterable params)`
- `public abstract Database.QueryLocator selectQueryLocatorInjection(Type methodClazzType, ISelectorMethodParameterable params)`
- `public abstract void configureQueryFactoryFields(fflib_QueryFactory queryFactory, String relationshipFieldPath)`
- `public abstract fflib_QueryFactory addQueryFactorySubselect(fflib_QueryFactory parentQueryFactory)`

