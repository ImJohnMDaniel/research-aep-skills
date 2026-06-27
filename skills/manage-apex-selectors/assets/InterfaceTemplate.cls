public interface {{InterfaceName}} 
    extends IApplicationSObjectSelector 
{
    List<{{SObjectName}}> selectById(Set<Id> idSet);
}
