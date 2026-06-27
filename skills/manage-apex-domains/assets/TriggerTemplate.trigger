trigger {{TriggerName}} on {{SObjectName}} 
    (after delete, after insert, after update, after undelete, before delete, before insert, before update) 
{
    fflib_SObjectDomain.triggerHandler({{ClassName}}.class);
}
