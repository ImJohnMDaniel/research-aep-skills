<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/force-di @ 574d050 (class di_Injector)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# di_Injector

**Framework:** force-di

`public`

## Constructors

- `public di_Injector(di_Module module)`
- `public di_Injector(List modules)`

## Properties

- `static public final di_Injector Org`
- `di_Module module`
- `List<di_Module> modules`
- `System.Type developerNameByType`
- `Object params`
- `String developerName`
- `List<di_Binding> bindingsFound`
- `Schema.SObjectType bindingSObjectType`

## Methods

- `public Object getInstance(Type developerNameByType)`
- `public Object getInstance(Type developerNameByType, Object params)`
- `public Object getInstance(String developerName)`
- `public Object getInstance(String developerName, Object params)`
- `public Object getInstance(Type developerNameByType, Schema.SObjectType bindingSObjectType)`
- `public Object getInstance(Type developerNameByType, Schema.SObjectType bindingSObjectType, Object params)`
- `public Object getInstance(String developerName, Schema.SObjectType bindingSObjectType, Object params)`

## Inner Types

### di_Injector.InjectorException

`public` — extends `Exception`

