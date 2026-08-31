<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-common @ 485d304 (class fflib_SObjects)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_SObjects

**Framework:** fflib-apex-common

`virtual public` — extends `fflib_Objects`, implements `fflib_ISObjects`

## Constructors

- `public fflib_SObjects(List records)`
- `public fflib_SObjects(List records, Schema.SObjectType sObjectType)`

## Properties

- `List<SObject> records`
- `Schema.SObjectType sObjectType`
- `String message`
- `SObject record`
- `Schema.SObjectField field`
- `Set<Schema.SObjectField> fields`
- `Set<Id> result`
- `Object value`
- `Set<Object> values`
- `Boolean allBlank`
- `Boolean allNonBlank`
- `Schema.SObjectField fieldToCheck`
- `Schema.SObjectField fieldToUpdate`
- `Object keyValue`

## Methods

- `virtual public List getRecords()`
- `virtual public Set getRecordIds()`
- `virtual public override Object getType()`
- `virtual public Schema.SObjectType getSObjectType()`
- `virtual public void addError(String message)`
- `virtual public void addError(Schema.SObjectField field, String message)`
- `virtual public void clearField(Schema.SObjectField field)`
- `virtual public void clearFields(Set fields)`
- `virtual protected String error(String message, SObject record)`
- `virtual protected String error(String message, SObject record, Schema.SObjectField field)`
- `protected Set getIdFieldValues(Schema.SObjectField field)`
- `protected Set getStringFieldValues(Schema.SObjectField field)`
- `virtual protected Set getFieldValues(Schema.SObjectField field)`
- `virtual protected List getRecordsByFieldValue(Schema.SObjectField field, Object value)`
- `virtual protected List getRecordsByFieldValues(Schema.SObjectField field, Set values)`
- `virtual protected List getRecordsWithBlankFieldValues(Schema.SObjectField field)`
- `virtual protected List getRecordsWithBlankFieldValues(Set fields)`
- `virtual protected List getRecordsWithAllBlankFieldValues(Set fields)`
- `virtual protected List getRecordsWithNotBlankFieldValues(Schema.SObjectField field)`
- `virtual protected List getRecordsWithNotBlankFieldValues(Set fields)`
- `virtual protected List getRecordsWithAllNotBlankFieldValues(Set fields)`
- `virtual protected void setFieldValue(Schema.SObjectField field, Object value)`
- `virtual protected void setFieldValueByMap(Schema.SObjectField fieldToCheck, Schema.SObjectField fieldToUpdate, Map values)`

## Inner Types

### fflib_SObjects.ErrorFactory

`virtual public`

#### Properties

- `String message`
- `SObject record`
- `fflib_SObjects domain`
- `fflib_SObjects.ObjectError objectError`
- `Schema.SObjectField field`
- `fflib_SObjects.FieldError fieldError`

#### Methods

- `public String error(String message, SObject record)`
- `public String error(fflib_SObjects domain, String message, SObject record)`
- `public String error(String message, SObject record, Schema.SObjectField field)`
- `public String error(fflib_ISObjects domain, String message, SObject record, Schema.SObjectField field)`
- `public List getAll()`
- `public void clearAll()`

### fflib_SObjects.FieldError

`virtual public` — extends `fflib_SObjects.ObjectError`

#### Constructors

- `public FieldError()`

#### Properties

- `public Schema.SObjectField field`

### fflib_SObjects.ObjectError

`virtual public` — extends `fflib_SObjects.Error`

#### Constructors

- `public ObjectError()`

#### Properties

- `public SObject record`

### fflib_SObjects.Error

`public abstract`

#### Properties

- `public String message`
- `public fflib_ISObjects domain`

