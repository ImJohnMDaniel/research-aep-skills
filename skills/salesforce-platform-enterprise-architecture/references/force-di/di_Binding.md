<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/force-di @ 574d050 (class di_Binding)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# di_Binding

**Framework:** force-di

`public abstract` — implements `System.Comparable`

## Properties

- `Object params`
- `Boolean newInstance`
- `Object compareTo`
- `di_Binding binding`
- `String hashValue`
- `di_Binding.BindingType bindType`
- `String developerName`
- `Schema.SObjectType bindingObject`
- `Integer bindingSequence`
- `Object to`
- `Object bindingData`
- `System.Type implType`

## Methods

- `public Object getInstance()`
- `public Object getInstance(Object params)`
- `public Object getInstance(Object params, Boolean newInstance)`
- `public abstract Object newInstance(Object params)`
- `public Integer compareTo(Object compareTo)`
- `public override String toString()`
- `static public di_Binding newInstance(BindingType bindType, String developerName, Schema.SObjectType bindingObject, Integer bindingSequence, Object to, Object bindingData)`

## Inner Types

### di_Binding.Provider

`public`

#### Properties

- `Object params`

#### Methods

- `public abstract Object newInstance(Object params)`

### di_Binding.Resolver

`public`

#### Constructors

- `public Resolver(List modules)`

#### Properties

- `List<di_Module> modules`
- `di_Module module`
- `String developerName`
- `Schema.SObjectType bindingObject`
- `Object mockType`
- `Integer currentBindingsIndex`
- `di_Binding bind`
- `Boolean isMatch`
- `di_Module embeddedModule`
- `List<di_Binding> matchedBindings`

#### Methods

- `public Resolver set(di_Module module)`
- `public Resolver add(di_Module module)`
- `public Resolver byName(String developerName)`
- `public Resolver bySObject(Schema.SObjectType bindingObject)`
- `public Resolver emptyBindingsAllowed()`
- `public Resolver replaceBindingWith(Object mockType)`
- `public List get()`

### di_Binding.BindingException

`public` — extends `Exception`

### di_Binding.BindingType

`public`

#### Properties

- `static public final BindingType Apex`
- `static public final BindingType VisualforceComponent`
- `static public final BindingType LightningComponent`
- `static public final BindingType Flow`
- `static public final BindingType Module`

