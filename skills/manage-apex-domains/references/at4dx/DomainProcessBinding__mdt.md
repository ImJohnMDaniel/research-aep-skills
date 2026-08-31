<!-- GENERATED FILE - do not edit by hand.
     Source: https://github.com/apex-enterprise-patterns/at4dx @ 8c109e4 (custom metadata type DomainProcessBinding__mdt)
     Generated: 2026-08-31T03:15:57.696Z by build/generate_references.cjs (ADR-0008) -->
# DomainProcessBinding__mdt

**Framework:** at4dx
**Label:** Domain Process Binding

## Fields

| Field | Type | Label | References |
| --- | --- | --- | --- |
| `Id` | id(18) | Custom Metadata Record ID |  |
| `DeveloperName` | string(40) | Custom Metadata Record Name |  |
| `MasterLabel` | string(40) | Label |  |
| `Language` | picklist(40) | Master Language |  |
| `NamespacePrefix` | string(15) | Namespace Prefix |  |
| `Label` | string(40) | Label |  |
| `QualifiedApiName` | string(70) | Qualified API Name |  |
| `SystemModstamp` | datetime | System Modstamp |  |
| `ClassToInject__c` | string(255) | Class To Inject |  |
| `Description__c` | textarea(255) | Description |  |
| `DomainMethodToken__c` | string(255) | Domain Method Token |  |
| `ExecuteAsynchronous__c` | boolean | Execute Asynchronous |  |
| `IsActive__c` | boolean | Is Active |  |
| `LogicalInverse__c` | boolean | Logical Inverse |  |
| `OrderOfExecution__c` | double | Order Of Execution |  |
| `PreventRecursive__c` | boolean | Prevent Recursive |  |
| `ProcessContext__c` | picklist(255) | Process Context |  |
| `RelatedDomainBindingSObjectAlternate__c` | string(255) | Related Domain Binding SObject Alternate |  |
| `RelatedDomainBindingSObject__c` | string(255) | Related Domain SObject Binding |  |
| `TriggerOperation__c` | picklist(255) | Trigger Operation |  |
| `Type__c` | picklist(255) | Type |  |

