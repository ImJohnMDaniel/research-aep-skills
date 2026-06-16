public interface {{InterfaceName}} 
    extends IApplicationSObjectSelector 
{
    List<{{SObjectType}}> selectById(Set<Id> idSet);
}
