import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, Paperclip, MoreVertical, ShieldAlert, X, Coffee, Database, Search, Code, Terminal, Users, UserPlus, Check, Trash2, Edit2, Copy, Edit3, CornerUpLeft, SmilePlus } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatRoom() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('member');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const presenceChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  
  // Modal state for Session
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [mySessions, setMySessions] = useState([]);
  const [sessionSearch, setSessionSearch] = useState('');

  // Modal state for Manage Members
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [globalUsers, setGlobalUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [currentMembers, setCurrentMembers] = useState([]);
  
  // Modal state for Settings
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');

  // Modal state for Quick Snippet
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [snippetData, setSnippetData] = useState({ subject: 'Java', title: 'Quick Snippet', aim: '', code: '', output: '' });
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchGroupDetails();
    fetchMessages();
    
    const channel = supabase
      .channel(`chat_room_${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${chatId}`
      }, async (payload) => {
        let newMsg = payload.new;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.session_id) {
          fetchMessages();
        }
        setTimeout(scrollToBottom, 50);
      })
      .subscribe();

    const pChannel = supabase.channel(`room_presence_${chatId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    pChannel
      .on('presence', { event: 'sync' }, () => {
        const state = pChannel.presenceState();
        const currentlyTyping = [];
        for (const id in state) {
          if (id !== user.id) {
            const presences = state[id];
            if (presences.some(p => p.typing)) {
              currentlyTyping.push(presences[0].user_email);
            }
          }
        }
        setTypingUsers(currentlyTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await pChannel.track({ user_email: user.email, typing: false });
        }
      });
      
    presenceChannelRef.current = pChannel;

    const reactionsChannel = supabase
      .channel(`chat_reactions_${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => {
        fetchMessages();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(pChannel);
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupDetails = async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', chatId)
        .single();
        
      if (groupError) throw groupError;
      setGroup(groupData);

      const { data: memberData } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', chatId)
        .eq('user_id', user.id)
        .single();
        
      if (memberData) {
        setCurrentUserRole(memberData.role);
      } else {
        // App Admins also have implicit admin rights
        const isAdmin = user.email === '2072@admin.com' || user.email === 'admin@codevault.edu';
        if (isAdmin) setCurrentUserRole('admin');
      }
    } catch (err) {
      console.error('Error fetching group:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*, sessions(id, title, subject, aim, code, output), message_reactions(*)')
        .eq('group_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = async () => {
    if (!isTypingRef.current && presenceChannelRef.current) {
      isTypingRef.current = true;
      await presenceChannelRef.current.track({ user_email: user.email, typing: true }).catch(() => {});
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(async () => {
      isTypingRef.current = false;
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.track({ user_email: user.email, typing: false }).catch(() => {});
      }
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    const tempId = crypto.randomUUID();
    const tempMsg = {
      id: tempId,
      group_id: chatId,
      user_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      reply_to_id: replyingTo?.id || null,
      message_reactions: []
    };
    
    setMessages(prev => [...prev, tempMsg]);
    const currentReplyToId = replyingTo?.id || null;
    setReplyingTo(null);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({ user_email: user.email, typing: false }).catch(() => {});
    }
    
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          id: tempId,
          group_id: chatId,
          user_id: user.id,
          content: messageContent,
          reply_to_id: currentReplyToId
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    setShowEmojiPicker(null);
    const msg = messages.find(m => m.id === messageId);
    const existing = msg?.message_reactions?.find(r => r.user_id === user.id);
    
    try {
      if (existing && existing.emoji === emoji) {
        await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', user.id);
        await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
      }
      fetchMessages();
    } catch (err) {
      console.error('Error toggling reaction', err);
    }
  };

  const handleOpenSessionModal = async () => {
    setIsSessionModalOpen(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, subject, topic')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      setMySessions(data || []);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  };

  const handleAttachSession = async (session) => {
    setIsSessionModalOpen(false);
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: chatId,
          user_id: user.id,
          content: `Shared a session: ${session.title}`,
          session_id: session.id
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Failed to attach session:', err);
    }
  };

  const handleOpenManageModal = async () => {
    setIsManageModalOpen(true);
    try {
      const { data: users, error: userError } = await supabase.from('user_activity').select('*');
      if (userError) throw userError;
      
      const { data: members, error: memberError } = await supabase.from('group_members').select('user_id, role').eq('group_id', chatId);
      if (memberError) throw memberError;
      
      setGlobalUsers(users || []);
      setCurrentMembers(members || []);
    } catch (err) {
      console.error('Error fetching manage data:', err);
    }
  };

  const handleRenameGroup = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim()) return;
    try {
      const { error } = await supabase.from('groups').update({ name: editGroupName.trim() }).eq('id', chatId);
      if (error) throw error;
      setGroup(prev => ({ ...prev, name: editGroupName.trim() }));
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error('Error renaming group', err);
    }
  };

  const handleDeleteGroup = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this group? All messages and history will be lost forever.");
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('groups').delete().eq('id', chatId);
      if (error) throw error;
      navigate('/chat');
    } catch (err) {
      console.error('Error deleting group', err);
      alert('Failed to delete group. Make sure you are an admin.');
    }
  };

  const handleOpenNewSnippet = () => {
    setEditingSessionId(null);
    setSnippetData({ subject: 'Java', title: 'Quick Snippet', aim: '', code: '', output: '' });
    setIsSnippetModalOpen(true);
  };

  const handleOpenEditSnippet = (session) => {
    setEditingSessionId(session.id);
    setSnippetData({
      subject: session.subject || 'Java',
      title: session.title || 'Quick Snippet',
      aim: session.aim || '',
      code: session.code || '',
      output: session.output || ''
    });
    setIsSnippetModalOpen(true);
  };

  const handleSaveSnippet = async (e) => {
    e.preventDefault();
    if (!snippetData.code.trim()) return;

    try {
      if (editingSessionId) {
        const { error } = await supabase.from('sessions').update({
          subject: snippetData.subject,
          title: snippetData.title,
          aim: snippetData.aim,
          code: snippetData.code,
          output: snippetData.output,
          updated_at: new Date().toISOString()
        }).eq('id', editingSessionId);
        
        if (error) throw error;
        fetchMessages();
      } else {
        const { data: sessionData, error: sessionError } = await supabase.from('sessions').insert({
          user_id: user.id,
          user_email: user.email,
          subject: snippetData.subject,
          title: snippetData.title,
          aim: snippetData.aim,
          code: snippetData.code,
          output: snippetData.output
        }).select().single();
        
        if (sessionError) throw sessionError;
        
        const tempId = crypto.randomUUID();
        const tempMsg = {
          id: tempId,
          group_id: chatId,
          user_id: user.id,
          content: "Shared a Quick Snippet",
          created_at: new Date().toISOString(),
          session_id: sessionData.id,
          sessions: sessionData
        };
        
        setMessages(prev => [...prev, tempMsg]);
        
        const { error: msgError } = await supabase.from('group_messages').insert({
          id: tempId,
          group_id: chatId,
          user_id: user.id,
          content: "Shared a Quick Snippet",
          session_id: sessionData.id
        });
        
        if (msgError) throw msgError;
      }
      setIsSnippetModalOpen(false);
    } catch (err) {
      console.error('Error saving snippet:', err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: chatId,
        user_id: userId,
        role: 'member'
      });
      if (error) throw error;
      
      setCurrentMembers(prev => [...prev, { user_id: userId, role: 'member' }]);
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canSendMessages = group?.admin_only ? currentUserRole === 'admin' : true;
  const filteredSessions = mySessions.filter(s => s.title?.toLowerCase().includes(sessionSearch.toLowerCase()));
  const filteredGlobalUsers = globalUsers.filter(u => u.email?.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-dark-bg border border-dark-border rounded-2xl overflow-hidden shadow-2xl relative">
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'url(/chat-bg.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '300px'
        }}
      />
      
      <header className="bg-dark-surface border-b border-dark-border p-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/chat')}
            className="p-2 text-dark-muted hover:text-white rounded-full hover:bg-dark-bg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center font-bold text-primary shadow-inner shrink-0">
              {group?.name?.charAt(0).toUpperCase() || 'G'}
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold font-sans tracking-wide leading-tight truncate">{group?.name || 'Chat'}</h2>
              <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">
                {group?.is_global ? 'Global Channel' : group?.is_direct_message ? 'Direct Message' : 'Group'}
                {group?.admin_only && ' • Admin Only'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {currentUserRole === 'admin' && !group?.is_direct_message && (
            <button 
              onClick={handleOpenManageModal}
              className="p-2 text-dark-muted hover:text-white rounded-full hover:bg-dark-bg transition-colors shrink-0"
              title="Manage Members"
            >
              <Users size={18} />
            </button>
          )}
          {currentUserRole === 'admin' && (
            <button 
              onClick={() => {
                setEditGroupName(group?.name || '');
                setIsSettingsModalOpen(true);
              }}
              className="p-2 text-dark-muted hover:text-white rounded-full hover:bg-dark-bg transition-colors shrink-0"
              title="Group Settings"
            >
              <MoreVertical size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 z-10 flex flex-col gap-3">
        <div className="flex justify-center mb-4">
          <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono px-3 py-1.5 rounded-lg text-center max-w-xs shadow-md">
            Messages and shared code sessions are secured with CodeVault encryption.
          </span>
        </div>

        {messages.map((msg) => {
          const isMine = msg.user_id === user.id;
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col w-full max-w-[95%] sm:max-w-[85%] md:max-w-[75%] ${isMine ? 'self-end' : 'self-start'}`}
            >
              {!group?.is_direct_message && !isMine && (
                <span className="text-[10px] font-mono text-dark-muted ml-1 mb-1">
                  User {msg.user_id.substring(0, 5)}
                </span>
              )}
              <div 
                className={`relative group px-4 py-2.5 rounded-2xl shadow-md text-sm font-sans flex flex-col gap-2 ${

                  isMine 
                    ? 'bg-[#0f211c] text-white border border-[#1a3830] rounded-tr-sm' 
                    : 'bg-dark-surface text-white border border-dark-border rounded-tl-sm'
                }`}
              >
                
                {/* Reply/React Hover Buttons */}
                <div className={`absolute top-0 ${isMine ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-dark-bg border border-dark-border rounded-lg shadow-lg z-20`}>
                  <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1.5 text-dark-muted hover:text-primary transition-colors cursor-pointer" title="React">
                    <SmilePlus size={16} />
                  </button>
                  <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-dark-muted hover:text-primary transition-colors cursor-pointer" title="Reply">
                    <CornerUpLeft size={16} />
                  </button>
                  
                  {/* Emoji Picker Popover */}
                  {showEmojiPicker === msg.id && (
                    <div className={`absolute top-full mt-1 ${isMine ? 'right-0' : 'left-0'} bg-dark-surface border border-dark-border rounded-full p-1.5 shadow-xl flex items-center gap-1 z-30`}>
                      {['👍', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                        <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className="hover:scale-125 transition-transform text-lg cursor-pointer px-1">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Replied Message Quote Box */}
                {msg.reply_to_id && (
                  <div className="bg-[#0a1410]/50 p-2 rounded-lg border-l-2 border-primary mb-1 text-xs text-dark-muted cursor-pointer hover:bg-[#0a1410]/80 transition-colors">
                    <div className="flex items-center gap-1 font-bold text-primary mb-0.5">
                      <CornerUpLeft size={10} /> 
                      Replying to
                    </div>
                    <div className="truncate">
                      {(() => {
                        const parent = messages.find(m => m.id === msg.reply_to_id);
                        if (!parent) return 'Original message...';
                        if (parent.session_id) return 'Code Snippet';
                        return parent.content;
                      })()}
                    </div>
                  </div>
                )}

                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                
                {msg.session_id && msg.sessions && (
                  <div className="mt-1 bg-dark-bg/60 border border-dark-border rounded-xl overflow-hidden text-left flex flex-col w-full">
                    <div className="p-2.5 border-b border-dark-border/50 flex items-center justify-between bg-dark-surface/80">
                      <div className="flex items-center gap-2 min-w-0">
                        {msg.sessions.subject === 'Java' ? <Coffee size={14} className="text-orange-400 shrink-0" /> : <Database size={14} className="text-green-400 shrink-0" />}
                        <h4 className="font-bold text-white text-xs truncate leading-tight">{msg.sessions.title}</h4>
                      </div>
                      {isMine && (
                        <button onClick={() => handleOpenEditSnippet(msg.sessions)} className="text-dark-muted hover:text-white p-1 rounded hover:bg-dark-bg cursor-pointer shrink-0" title="Edit Snippet">
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                    
                    {msg.sessions.aim && (
                      <div className="p-2.5 text-[11px] text-dark-muted border-b border-dark-border/50 italic font-serif leading-relaxed line-clamp-2">
                        {msg.sessions.aim}
                      </div>
                    )}
                    
                    {msg.sessions.code && (
                      <div className="p-0 border-b border-dark-border/50">
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-dark-surface/40 border-b border-dark-border/30">
                          <div className="flex items-center gap-1.5 text-[9px] text-primary font-mono uppercase tracking-widest">
                            <Code size={10} /> Code Snippet
                          </div>
                          <button onClick={() => navigator.clipboard.writeText(msg.sessions.code)} className="text-dark-muted hover:text-white p-0.5 rounded cursor-pointer" title="Copy Code">
                            <Copy size={12} />
                          </button>
                        </div>
                        <pre className="p-2.5 text-[11px] md:text-[12px] font-mono text-gray-300 overflow-x-auto w-full max-h-[40vh]">
                          <code>{msg.sessions.code}</code>
                        </pre>
                      </div>
                    )}
                    
                    {msg.sessions.output && (
                      <div className="p-0">
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0a1410] border-b border-dark-border/30">
                          <div className="flex items-center gap-1.5 text-[9px] text-green-400 font-mono uppercase tracking-widest">
                            <Terminal size={10} /> Terminal Output
                          </div>
                          <button onClick={() => navigator.clipboard.writeText(msg.sessions.output)} className="text-dark-muted hover:text-white p-0.5 rounded cursor-pointer" title="Copy Output">
                            <Copy size={12} />
                          </button>
                        </div>
                        <pre className="p-2.5 text-[11px] md:text-[12px] font-mono text-green-300 overflow-x-auto w-full max-h-[30vh] bg-[#0a1410]/80">
                          <code>{msg.sessions.output}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`text-[9px] mt-0.5 text-right font-mono ${isMine ? 'text-primary/70' : 'text-dark-muted'}`}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                </div>

                {/* Reactions Badge */}
                {msg.message_reactions && msg.message_reactions.length > 0 && (
                  <div className={`absolute -bottom-3 ${isMine ? 'right-2' : 'left-2'} z-10 flex gap-1`}>
                    {Object.entries(
                      msg.message_reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => {
                      const hasReacted = msg.message_reactions.some(r => r.user_id === user.id && r.emoji === emoji);
                      return (
                        <button 
                          key={emoji} 
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-colors shadow-sm ${
                            hasReacted 
                              ? 'bg-primary/20 border-primary text-primary' 
                              : 'bg-dark-surface border-dark-border text-white hover:border-primary/50'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-dark-surface border-t border-dark-border p-3 z-10 shrink-0">
        {!canSendMessages ? (
          <div className="flex items-center justify-center gap-2 bg-dark-bg border border-dark-border py-3 rounded-xl text-dark-muted text-sm font-sans">
            <ShieldAlert size={16} />
            <span>Only admins can send messages</span>
          </div>
        ) : (
          <>
          {typingUsers.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 mb-1 w-full translate-y-2">
              <div className="flex gap-1 items-center bg-dark-bg/80 px-3 py-1.5 rounded-full border border-dark-border/40 shadow-sm backdrop-blur-sm z-20">
                <div className="flex gap-1 items-end h-3 mr-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-dark-muted font-mono tracking-widest italic truncate max-w-[200px]">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].split('@')[0]} is typing...`
                    : `${typingUsers[0].split('@')[0]} & ${typingUsers.length - 1} other${typingUsers.length > 2 ? 's' : ''} typing...`}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex flex-col gap-2 max-w-4xl mx-auto w-full">
            {replyingTo && (
              <div className="flex items-center justify-between bg-dark-bg border-l-2 border-primary rounded-r-xl p-3 mx-12">
                <div className="min-w-0">
                  <div className="text-primary text-xs font-bold flex items-center gap-1 mb-1">
                    <CornerUpLeft size={12} /> Replying
                  </div>
                  <div className="text-dark-muted text-xs truncate">
                    {replyingTo.session_id ? 'Code Snippet' : replyingTo.content}
                  </div>
                </div>
                <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-dark-muted hover:text-white cursor-pointer rounded-full hover:bg-dark-surface">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 w-full">
            <button 
              type="button"
              onClick={handleOpenSessionModal}
              className="p-2 sm:p-3 text-dark-muted hover:text-primary transition-colors cursor-pointer shrink-0"
              title="Attach CodeVault Session"
            >
              <Paperclip size={20} />
            </button>
            <button 
              type="button"
              onClick={handleOpenNewSnippet}
              className="p-2 sm:p-3 text-dark-muted hover:text-primary transition-colors cursor-pointer shrink-0"
              title="Quick Code Snippet"
            >
              <Code size={20} />
            </button>
            <div className="flex-1 bg-dark-bg border border-dark-border rounded-2xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden flex items-center min-h-[44px]">
              <textarea
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-transparent text-white px-4 py-3 max-h-32 focus:outline-none resize-none font-sans text-sm"
                rows="1"
              />
            </div>
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-primary text-dark-bg rounded-full hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send size={18} className="translate-x-[1px]" />
            </button>
            </div>
          </form>
          </>
        )}
      </footer>

      {/* Manage Members Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-bg border border-dark-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-surface">
              <h3 className="text-white font-bold font-sans flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Manage Group Members
              </h3>
              <button 
                onClick={() => setIsManageModalOpen(false)}
                className="text-dark-muted hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-dark-border bg-dark-bg">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                <input
                  type="text"
                  placeholder="Search user emails to add..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              <ul className="divide-y divide-dark-border/50">
                {filteredGlobalUsers.map(u => {
                  const isMember = currentMembers.some(m => m.user_id === u.user_id);
                  return (
                    <li key={u.user_id} className="p-4 flex items-center justify-between hover:bg-dark-surface/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.email}</p>
                        <p className="text-xs text-dark-muted font-mono mt-0.5">
                          Last seen: {formatDistanceToNow(new Date(u.last_seen_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {isMember ? (
                        <span className="flex items-center gap-1 text-xs text-dark-muted bg-dark-surface px-2.5 py-1.5 rounded-lg border border-dark-border">
                          <Check size={14} className="text-green-400" /> Member
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAddMember(u.user_id)}
                          className="flex items-center gap-1.5 text-xs text-dark-bg font-bold bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                        >
                          <UserPlus size={14} /> Add
                        </button>
                      )}
                    </li>
                  );
                })}
                {filteredGlobalUsers.length === 0 && (
                  <li className="p-8 text-center text-dark-muted text-sm italic">
                    No users found.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-dark-bg border border-dark-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-surface">
              <h3 className="text-white font-bold font-sans flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                Group Settings
              </h3>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-dark-muted hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRenameGroup} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono text-dark-muted mb-2 uppercase tracking-wide">Rename Group</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  placeholder="New group name..."
                />
              </div>
              <button
                type="submit"
                disabled={!editGroupName.trim() || editGroupName === group?.name}
                className="w-full bg-primary hover:bg-primary/90 text-dark-bg font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                Save Name
              </button>
            </form>
            
            <div className="p-5 border-t border-dark-border/50 bg-[#140a0a]">
              <h4 className="text-red-400 text-xs font-bold font-mono uppercase tracking-wide mb-3">Danger Zone</h4>
              <button
                onClick={handleDeleteGroup}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
              >
                <Trash2 size={16} /> Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Snippet Modal */}
      {isSnippetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-dark-bg border border-dark-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-surface">
              <h3 className="text-white font-bold font-sans flex items-center gap-2">
                <Code size={18} className="text-primary" />
                {editingSessionId ? 'Edit Snippet' : 'Quick Snippet'}
              </h3>
              <button 
                onClick={() => setIsSnippetModalOpen(false)}
                className="text-dark-muted hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSnippet} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-mono text-dark-muted mb-1.5 uppercase tracking-wide">Title</label>
                  <input
                    type="text"
                    value={snippetData.title}
                    onChange={e => setSnippetData(d => ({ ...d, title: e.target.value }))}
                    className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                    placeholder="e.g. My Algorithm"
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs font-mono text-dark-muted mb-1.5 uppercase tracking-wide">Language</label>
                  <select
                    value={snippetData.subject}
                    onChange={e => setSnippetData(d => ({ ...d, subject: e.target.value }))}
                    className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Java">Java</option>
                    <option value="MongoDB">MongoDB</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-dark-muted mb-1.5 uppercase tracking-wide">Definition / Aim</label>
                <textarea
                  value={snippetData.aim}
                  onChange={e => setSnippetData(d => ({ ...d, aim: e.target.value }))}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none min-h-[60px]"
                  placeholder="Explain what this code does..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-primary mb-1.5 uppercase tracking-wide">Code *</label>
                <textarea
                  value={snippetData.code}
                  onChange={e => setSnippetData(d => ({ ...d, code: e.target.value }))}
                  className="w-full bg-[#0a1014] border border-[#1a2b3c] rounded-xl px-4 py-3 text-sm text-blue-300 font-mono focus:border-primary focus:outline-none min-h-[150px]"
                  placeholder="Paste your code here..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-green-500 mb-1.5 uppercase tracking-wide">Output (Optional)</label>
                <textarea
                  value={snippetData.output}
                  onChange={e => setSnippetData(d => ({ ...d, output: e.target.value }))}
                  className="w-full bg-[#0a1410] border border-[#1a382a] rounded-xl px-4 py-3 text-sm text-green-300 font-mono focus:border-green-500 focus:outline-none min-h-[80px]"
                  placeholder="Paste the terminal output here..."
                />
              </div>

              <div className="pt-4 border-t border-dark-border mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSnippetModalOpen(false)}
                  className="flex-1 py-2.5 bg-dark-bg border border-dark-border text-white font-bold rounded-xl hover:bg-dark-surface transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!snippetData.code.trim()}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-dark-bg font-bold rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex justify-center items-center gap-2"
                >
                  <Send size={16} />
                  {editingSessionId ? 'Save Changes' : 'Send Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Selection Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-dark-bg border border-dark-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-surface">
              <h3 className="text-white font-bold font-sans">Share a Session</h3>
              <button 
                onClick={() => setIsSessionModalOpen(false)}
                className="text-dark-muted hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-dark-border bg-dark-bg">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                <input
                  type="text"
                  placeholder="Search your sessions..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-dark-muted font-sans text-sm">
                  No sessions found.
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredSessions.map(session => (
                    <li key={session.id}>
                      <button
                        onClick={() => handleAttachSession(session)}
                        className="w-full text-left p-3 rounded-xl hover:bg-dark-surface flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${session.subject === 'Java' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                          {session.subject === 'Java' ? <Coffee size={16} /> : <Database size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-medium text-sm truncate">{session.title || 'Untitled Session'}</h4>
                          <p className="text-xs text-dark-muted font-sans truncate">{session.topic || 'No topic'}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
