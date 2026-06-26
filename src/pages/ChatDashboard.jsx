import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Plus, Users, Search, Mail, UserPlus, Clock, User, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const isAdmin = user?.email?.toLowerCase() === 'admin@admin.com';
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    fetchChats();
    
    // Subscribe to new groups or messages
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, () => {
        fetchChats();
      })
      .subscribe();
      
  

  return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchChats = async () => {
    try {
      const { data: usersData } = await supabase.from('user_activity').select('*');
      if (usersData) {
        setAllUsers(usersData.filter(u => u.user_id !== user.id));
        const me = usersData.find(u => u.user_id === user.id);
        if (me?.username) {
          setCurrentUsername(me.username);
          setUsernameInput(me.username);
        }
      }
    } catch (e) { console.error(e) }
    

    setLoading(true);
    try {
      // Fetch all groups the user is part of
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, role, groups(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const { data: globalData, error: globalError } = await supabase
        .from('groups')
        .select('*')
        .eq('is_global', true);

      if (globalError) throw globalError;

      const memberGroupIds = new Set(memberData.map(gm => gm.group_id));
      const globalGroupsToAdd = (globalData || []).filter(g => !memberGroupIds.has(g.id)).map(g => ({
        group_id: g.id,
        role: 'member',
        groups: g
      }));

      const allGroups = [...memberData, ...globalGroupsToAdd];

      // Enhance with latest message
      const enhancedChats = await Promise.all(allGroups.map(async (gm) => {
        const { data: latestMsg } = await supabase
          .from('group_messages')
          .select('content, created_at')
          .eq('group_id', gm.group_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If direct message, figure out the other person's name
        let chatName = gm.groups.name;
        if (gm.groups.is_direct_message) {
          const { data: otherMember } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', gm.group_id)
            .neq('user_id', user.id)
            .single();
            
          if (otherMember) {
            const { data: otherUser } = await supabase
              .from('user_activity')
              .select('username, email')
              .eq('user_id', otherMember.user_id)
              .single();
            if (otherUser) {
              chatName = otherUser.username || otherUser.email.split('@')[0];
            }
          }
        }

        return {
          ...gm.groups,
          role: gm.role,
          latestMessage: latestMsg?.content || 'No messages yet',
          latestMessageTime: latestMsg?.created_at || gm.groups.created_at
        };
      }));

      // Sort by latest message time
      enhancedChats.sort((a, b) => new Date(b.latestMessageTime) - new Date(a.latestMessageTime));
      
      setChats(enhancedChats);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!isGroup) {
        // Create 1-on-1 Chat
        // In this flow, we will pass the selected user directly from the UI
        // We'll handle this in a separate function: handleCreateDM(otherUser)
      } else {
        // Create Group
        if (!groupName) return setError('Group name is required');
        
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .insert({
            name: groupName,
            is_direct_message: false,
            admin_only: isAdminOnly,
            is_global: isGlobal,
            created_by: user.id
          })
          .select()
          .single();
          
        if (groupError) throw groupError;
        
        // Add current user as admin
        await supabase.from('group_members').insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });
        
        setShowNewChatModal(false);
        navigate(`/chat/${group.id}`);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create chat. Make sure you ran the SQL script.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return setError('Username cannot be empty');
    
    try {
      const { error } = await supabase
        .from('user_activity')
        .update({ username: usernameInput.trim() })
        .eq('user_id', user.id);
        
      if (error) throw error;
      setCurrentUsername(usernameInput.trim());
      setShowProfileModal(false);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleCreateDM = async (otherUser) => {
    setError('');
    try {
      const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id, groups!inner(is_direct_message)')
        .eq('user_id', user.id)
        .eq('groups.is_direct_message', true);
        
      if (myGroups && myGroups.length > 0) {
        const groupIds = myGroups.map(g => g.group_id);
        const { data: sharedGroups } = await supabase
          .from('group_members')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('user_id', otherUser.user_id);
          
        if (sharedGroups && sharedGroups.length > 0) {
          setShowNewChatModal(false);
          navigate(`/chat/${sharedGroups[0].group_id}`);
          return;
        }
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: `DM between ${user.email} and ${otherUser.email}`,
          is_direct_message: true,
          created_by: user.id
        })
        .select()
        .single();
        
      if (groupError) throw groupError;
      
      await supabase.from('group_members').insert([
        { group_id: group.id, user_id: user.id, role: 'admin' },
        { group_id: group.id, user_id: otherUser.user_id, role: 'member' }
      ]);
      
      setShowNewChatModal(false);
      navigate(`/chat/${group.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create chat.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="bg-dark-bg border-b border-dark-border p-4 flex items-center justify-between z-10 shrink-0">
        <h1 className="text-xl font-bold text-white font-serif flex items-center gap-2">
          <MessageCircle className="text-primary" /> Chats
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-dark-bg hover:bg-dark-surface text-dark-muted hover:text-white border border-dark-border px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Settings size={16} /> <span className="hidden sm:inline">{currentUsername || 'Set Username'}</span>
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-dark-bg w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-border text-dark-muted">
              <MessageCircle size={24} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No Chats Yet</h2>
            <p className="text-dark-muted text-sm max-w-sm mx-auto mb-6">
              Start a new 1-on-1 conversation or create a group to share code with your friends.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="bg-primary hover:bg-primary/90 text-dark-bg px-6 py-2 rounded-xl font-bold transition-transform active:scale-95 cursor-pointer"
            >
              Start Chatting
            </button>
          </div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="group flex items-center gap-4 p-4 bg-dark-bg border border-dark-border hover:border-primary/40 rounded-xl cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center shrink-0">
                {chat.is_direct_message ? (
                  <UserPlus size={20} className="text-primary/70" />
                ) : (
                  <Users size={20} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-white font-bold truncate">{chat.name}</h3>
                  <span className="text-[10px] text-dark-muted font-mono shrink-0 ml-2">
                    {formatDistanceToNow(new Date(chat.latestMessageTime), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-dark-muted truncate">{chat.latestMessage}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white font-serif mb-6 flex items-center gap-2">
              <Plus className="text-primary" /> Start a Conversation
            </h2>
            
            <div className="flex gap-2 mb-6 p-1 bg-dark-bg rounded-lg">
              <button 
                onClick={() => setIsGroup(false)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${!isGroup ? 'bg-dark-surface text-primary shadow' : 'text-dark-muted hover:text-white'}`}
              >
                1-on-1 Chat
              </button>
              <button 
                onClick={() => setIsGroup(true)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${isGroup ? 'bg-dark-surface text-primary shadow' : 'text-dark-muted hover:text-white'}`}
              >
                New Group
              </button>
            </div>

            <form onSubmit={handleCreateChat} className="space-y-4">
              {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded">{error}</div>}
              
              {!isGroup ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="Search users..."
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {allUsers
                      .filter(u => 
                        (u.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                      )
                      .map(u => (
                        <div 
                          key={u.user_id}
                          onClick={() => handleCreateDM(u)}
                          className="flex items-center gap-3 p-2 hover:bg-dark-bg border border-transparent hover:border-dark-border rounded-lg cursor-pointer transition-all"
                        >
                          <div className="w-10 h-10 rounded-full bg-dark-surface flex items-center justify-center shrink-0 border border-dark-border">
                            <User size={16} className="text-primary/70" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{u.username || u.email.split('@')[0]}</div>
                            <div className="text-xs text-dark-muted truncate">{u.email}</div>
                          </div>
                        </div>
                      ))}
                    {allUsers.length === 0 && (
                      <div className="text-center text-dark-muted text-sm py-4">No other users found.</div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-mono text-dark-muted mb-1.5 uppercase tracking-wide">Group Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="e.g. Java Project Team"
                    />
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAdminOnly}
                      onChange={(e) => setIsAdminOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-dark-border text-primary focus:ring-primary focus:ring-offset-dark-bg bg-dark-surface"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">Admin-Only Messages</div>
                      <div className="text-xs text-dark-muted">Only admins can send messages in this group.</div>
                    </div>
                  </label>
                  {isAdmin && (
                    <label className="flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGlobal}
                        onChange={(e) => setIsGlobal(e.target.checked)}
                        className="w-4 h-4 rounded border-dark-border text-primary focus:ring-primary focus:ring-offset-dark-bg bg-dark-surface"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">Global Group</div>
                        <div className="text-xs text-dark-muted">Visible to ALL CodeVault users automatically.</div>
                      </div>
                    </label>
                  )}
                </>
              )}

              {isGroup && (
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-xl hover:bg-dark-border transition-colors font-sans text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold rounded-xl transition-transform active:scale-95 font-sans text-sm"
                  >
                    Create
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white font-serif mb-6 flex items-center gap-2">
              <User className="text-primary" /> Edit Profile
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded">{error}</div>}
              <div>
                <label className="block text-xs font-mono text-dark-muted mb-1.5 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. CodeNinja99"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-xl hover:bg-dark-border transition-colors font-sans text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold rounded-xl transition-transform active:scale-95 font-sans text-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
