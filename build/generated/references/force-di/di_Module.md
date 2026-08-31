<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/force-di @ 574d050 (class di_Module)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# di_Module

**Framework:** force-di

`virtual public`

## Constructors

- `public di_Module()`

## Properties

- `String value`
- `List<di_Binding.BindingType> bindEnumValues`
- `di_Binding.BindingType bindEnumValue`
- `System.Type bindingType`
- `Schema.SObjectType sObjectType`
- `String bindingName`
- `Integer sequence`
- `Object data`
- `String bindingTo`
- `Object to`
- `di_Binding newBinding`

## Methods

- `virtual public void configure()`
- `public di_Module type(String value)`
- `public di_Module type(BindingType value)`
- `public di_Module apex()`
- `public di_Module lightningComponent()`
- `public di_Module visualforceComponent()`
- `public di_Module flow()`
- `public di_Module module()`
- `public di_Module bind(Type bindingType)`
- `public di_Module bind(Schema.SObjectType sObjectType)`
- `public di_Module bind(String bindingName)`
- `public di_Module sequence(Integer sequence)`
- `public di_Module data(Object data)`
- `public di_Module to(String bindingTo)`
- `public di_Module to(Type bindingTo)`
- `public di_Module toObject(Object to)`
- `public List getBindings()`

## Inner Types

### di_Module.ModuleException

`public` — extends `Exception`

