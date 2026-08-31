<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/fflib-apex-mocks @ 6889cc0 (class fflib_Match)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# fflib_Match

**Framework:** fflib-apex-mocks

`public`

## Properties

- `static public Boolean Matching`
- `Integer expectedSize`
- `List<fflib_IMatcher> retval`
- `fflib_MethodArgValues methodArg`
- `List<fflib_IMatcher> targetMatchers`
- `Integer matchersSize`
- `Integer i`
- `Object argValue`
- `fflib_IMatcher matcher`
- `Object o1`
- `Object o2`
- `Object o3`
- `Object o4`
- `List<Object> o`
- `fflib_MatcherDefinitions.Connective connectiveExpression`
- `List<Object> ignoredMatcherObjects`
- `List<fflib_IMatcher> innerMatchers`
- `Integer innerMatcherCount`
- `fflib_IMatcher innerMatcher`
- `Object toMatch`
- `Date fromDate`
- `Boolean inclusive`
- `Date toDate`
- `Boolean inclusiveFrom`
- `Boolean inclusiveTo`
- `Decimal lower`
- `Decimal upper`
- `Boolean inclusiveLower`
- `Boolean inclusiveUpper`
- `Schema.SObjectType objectType`
- `Boolean matchInOrder`
- `String regEx`

## Methods

- `static public List getAndClearMatchers(Integer expectedSize)`
- `static public Boolean matchesAllArgs(fflib_MethodArgValues methodArg, List targetMatchers)`
- `static public Object matches(fflib_IMatcher matcher)`
- `static public Object allOf(Object o1, Object o2)`
- `static public Object allOf(Object o1, Object o2, Object o3)`
- `static public Object allOf(Object o1, Object o2, Object o3, Object o4)`
- `static public Object allOf(List o)`
- `static public Object anyOf(Object o1, Object o2)`
- `static public Object anyOf(Object o1, Object o2, Object o3)`
- `static public Object anyOf(Object o1, Object o2, Object o3, Object o4)`
- `static public Object anyOf(List o)`
- `static public Object isNot(Object o1)`
- `static public Object noneOf(Object o1, Object o2)`
- `static public Object noneOf(Object o1, Object o2, Object o3)`
- `static public Object noneOf(Object o1, Object o2, Object o3, Object o4)`
- `static public Object noneOf(List o)`
- `static public Object eq(Object toMatch)`
- `static public Boolean eqBoolean(Boolean toMatch)`
- `static public Date eqDate(Date toMatch)`
- `static public Datetime eqDatetime(Datetime toMatch)`
- `static public Decimal eqDecimal(Decimal toMatch)`
- `static public Double eqDouble(Double toMatch)`
- `static public Id eqId(Id toMatch)`
- `static public Integer eqInteger(Integer toMatch)`
- `static public List eqList(List toMatch)`
- `static public Long eqLong(Long toMatch)`
- `static public Schema.SObjectField eqSObjectField(Schema.SObjectField toMatch)`
- `static public Schema.SObjectType eqSObjectType(Schema.SObjectType toMatch)`
- `static public String eqString(String toMatch)`
- `static public Object refEq(Object toMatch)`
- `static public Boolean anyBoolean()`
- `static public Date anyDate()`
- `static public Datetime anyDatetime()`
- `static public Decimal anyDecimal()`
- `static public Double anyDouble()`
- `static public Schema.FieldSet anyFieldSet()`
- `static public Id anyId()`
- `static public Integer anyInteger()`
- `static public List anyList()`
- `static public Long anyLong()`
- `static public Object anyObject()`
- `static public String anyString()`
- `static public SObject anySObject()`
- `static public Schema.SObjectField anySObjectField()`
- `static public Schema.SObjectType anySObjectType()`
- `static public Date dateAfter(Date fromDate)`
- `static public Date dateAfter(Date fromDate, Boolean inclusive)`
- `static public Date dateBefore(Date toDate)`
- `static public Date dateBefore(Date toDate, Boolean inclusive)`
- `static public Date dateBetween(Date fromDate, Date toDate)`
- `static public Date dateBetween(Date fromDate, Boolean inclusiveFrom, Date toDate, Boolean inclusiveTo)`
- `static public Datetime datetimeAfter(Datetime fromDate)`
- `static public Datetime datetimeAfter(Datetime fromDate, Boolean inclusive)`
- `static public Datetime datetimeBefore(Datetime toDate)`
- `static public Datetime datetimeBefore(Datetime toDate, Boolean inclusive)`
- `static public Datetime datetimeBetween(Datetime fromDate, Datetime toDate)`
- `static public Datetime datetimeBetween(Datetime fromDate, Boolean inclusiveFrom, Datetime toDate, Boolean inclusiveTo)`
- `static public Decimal decimalBetween(Decimal lower, Decimal upper)`
- `static public Decimal decimalBetween(Decimal lower, Boolean inclusiveLower, Decimal upper, Boolean inclusiveUpper)`
- `static public Decimal decimalLessThan(Decimal toMatch)`
- `static public Decimal decimalLessThan(Decimal toMatch, Boolean inclusive)`
- `static public Decimal decimalMoreThan(Decimal toMatch)`
- `static public Decimal decimalMoreThan(Decimal toMatch, Boolean inclusive)`
- `static public Double doubleBetween(Double lower, Double upper)`
- `static public Double doubleBetween(Double lower, Boolean inclusiveLower, Double upper, Boolean inclusiveUpper)`
- `static public Double doubleLessThan(Double toMatch)`
- `static public Double doubleLessThan(Double toMatch, Boolean inclusive)`
- `static public Double doubleMoreThan(Double toMatch)`
- `static public Double doubleMoreThan(Double toMatch, Boolean inclusive)`
- `static public Schema.FieldSet fieldSetEquivalentTo(Schema.FieldSet toMatch)`
- `static public Integer integerBetween(Integer lower, Integer upper)`
- `static public Integer integerBetween(Integer lower, Boolean inclusiveLower, Integer upper, Boolean inclusiveUpper)`
- `static public Integer integerLessThan(Integer toMatch)`
- `static public Integer integerLessThan(Integer toMatch, Boolean inclusive)`
- `static public Integer integerMoreThan(Integer toMatch)`
- `static public Integer integerMoreThan(Integer toMatch, Boolean inclusive)`
- `static public Object isNotNull()`
- `static public Object isNull()`
- `static public Object listContains(Object toMatch)`
- `static public Object listIsEmpty()`
- `static public Long longBetween(Long lower, Long upper)`
- `static public Long longBetween(Long lower, Boolean inclusiveLower, Long upper, Boolean inclusiveUpper)`
- `static public Long longLessThan(Long toMatch)`
- `static public Long longLessThan(Long toMatch, Boolean inclusive)`
- `static public Long longMoreThan(Long toMatch)`
- `static public Long longMoreThan(Long toMatch, Boolean inclusive)`
- `static public SObject sObjectOfType(Schema.SObjectType objectType)`
- `static public SObject sObjectWith(Map toMatch)`
- `static public List sObjectsWith(List toMatch)`
- `static public List sObjectsWith(List toMatch, Boolean matchInOrder)`
- `static public SObject sObjectWithId(Id toMatch)`
- `static public SObject sObjectWithName(String toMatch)`
- `static public String stringContains(String toMatch)`
- `static public String stringEndsWith(String toMatch)`
- `static public String stringIsBlank()`
- `static public String stringIsNotBlank()`
- `static public String stringMatches(String regEx)`
- `static public String stringStartsWith(String toMatch)`

