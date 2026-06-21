import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Plus, Users, Search, Mail, UserPlus, Clock } from 'lucide-react';
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
  const [error, setError] = useState('');

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
    setLoading(true);
    try {
      // Fetch all groups the user is part of
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, role, groups(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Enhance with latest message
      const enhancedChats = await Promise.all(memberData.map(async (gm) => {
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
            // For now, display ID or wait, supabase auth.users is restricted.
            // We should use the description or name field of the group to store the emails when creating a DM.
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
        if (!newChatEmail) return setError('Email is required');
        
        // Let's create a group for the DM
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .insert({
            name: `DM with ${newChatEmail}`,
            is_direct_message: true,
            created_by: user.id
          })
          .select()
          .single();
          
        if (groupError) throw groupError;
        
        // Add current user
        await supabase.from('group_members').insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });
        
        // Note: For a real app, we need an Edge Function to look up the other user's ID by email, 
        // because auth.users is restricted. For this beta, we will just navigate to the chat room 
        // and allow the user to share the link to join, OR rely on an invitation system.
        // For now, creating the group is enough to start chatting.
        
        setShowNewChatModal(false);
        navigate(`/chat/${group.id}`);
        
      } else {
        // Create Group
        if (!groupName) return setError('Group name is required');
        
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .insert({
            name: groupName,
            is_direct_message: false,
            admin_only: isAdminOnly,
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

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="bg-dark-bg border-b border-dark-border p-4 flex items-center justify-between z-10 shrink-0">
        <h1 className="text-xl font-bold text-white font-serif flex items-center gap-2">
          <MessageCircle className="text-primary" /> Chats
        </h1>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus size={16} /> New Chat
        </button>
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
                <div>
                  <label className="block text-xs font-mono text-dark-muted mb-1.5 uppercase tracking-wide">Friend's Email</label>
                  <input
                    type="email"
                    value={newChatEmail}
                    onChange={(e) => setNewChatEmail(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter email to chat"
                  />
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
                </>
              )}

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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
