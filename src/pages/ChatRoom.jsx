import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, Paperclip, MoreVertical, ShieldAlert, X, Coffee, Database, Search, Code, Terminal } from 'lucide-react';
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
  
  // Modal state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [mySessions, setMySessions] = useState([]);
  const [sessionSearch, setSessionSearch] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchGroupDetails();
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_room_${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${chatId}`
      }, async (payload) => {
        let newMsg = payload.new;
        
        // If this message has an attached session, fetch its details to render the Code Card
        if (newMsg.session_id) {
          const { data } = await supabase
            .from('sessions')
            .select('title, subject, aim, code, output')
            .eq('id', newMsg.session_id)
            .single();
            
          if (data) newMsg.sessions = data;
        }
        
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
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
        
      if (memberData) setCurrentUserRole(memberData.role);
    } catch (err) {
      console.error('Error fetching group:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*, sessions(title, subject, aim, code, output)')
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage;
    setNewMessage(''); // optimistic clear
    
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: chatId,
          user_id: user.id,
          content: messageContent.trim()
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Failed to send message:', err);
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canSendMessages = group?.admin_only ? currentUserRole === 'admin' : true;
  const filteredSessions = mySessions.filter(s => s.title?.toLowerCase().includes(sessionSearch.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-dark-bg border border-dark-border rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Doodle Background Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'url(/chat-bg.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '300px'
        }}
      />
      
      {/* Header */}
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
                {group?.is_direct_message ? 'Direct Message' : 'Group'}
                {group?.admin_only && ' • Admin Only'}
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 text-dark-muted hover:text-white rounded-full hover:bg-dark-bg transition-colors shrink-0">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 z-10 flex flex-col gap-3">
        {/* End-to-end encryption notice like WhatsApp */}
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
              className={`flex flex-col w-full max-w-[85%] md:max-w-[75%] ${isMine ? 'self-end' : 'self-start'}`}
            >
              {!group?.is_direct_message && !isMine && (
                <span className="text-[10px] font-mono text-dark-muted ml-1 mb-1">
                  User {msg.user_id.substring(0, 5)}
                </span>
              )}
              <div 
                className={`relative px-4 py-2.5 rounded-2xl shadow-md text-sm font-sans flex flex-col gap-2 ${
                  isMine 
                    ? 'bg-[#0f211c] text-white border border-[#1a3830] rounded-tr-sm' 
                    : 'bg-dark-surface text-white border border-dark-border rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                
                {/* Code Card Render */}
                {msg.session_id && msg.sessions && (
                  <div className="mt-1 bg-dark-bg/60 border border-dark-border rounded-xl overflow-hidden text-left flex flex-col w-full max-w-[350px]">
                    <div className="p-2.5 border-b border-dark-border/50 flex items-center gap-2 bg-dark-surface/80">
                      {msg.sessions.subject === 'Java' ? <Coffee size={14} className="text-orange-400 shrink-0" /> : <Database size={14} className="text-green-400 shrink-0" />}
                      <h4 className="font-bold text-white text-xs truncate leading-tight">{msg.sessions.title}</h4>
                    </div>
                    
                    {msg.sessions.aim && (
                      <div className="p-2.5 text-[11px] text-dark-muted border-b border-dark-border/50 italic font-serif leading-relaxed line-clamp-2">
                        {msg.sessions.aim}
                      </div>
                    )}
                    
                    {msg.sessions.code && (
                      <div className="p-0 border-b border-dark-border/50">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-dark-surface/40 text-[9px] text-primary font-mono uppercase tracking-widest border-b border-dark-border/30">
                          <Code size={10} /> Code Snippet
                        </div>
                        <pre className="p-2.5 text-[10px] md:text-[11px] font-mono text-gray-300 overflow-x-auto max-w-full max-h-32">
                          <code>{msg.sessions.code}</code>
                        </pre>
                      </div>
                    )}
                    
                    {msg.sessions.output && (
                      <div className="p-0">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0a1410] text-[9px] text-green-400 font-mono uppercase tracking-widest border-b border-dark-border/30">
                          <Terminal size={10} /> Terminal Output
                        </div>
                        <pre className="p-2.5 text-[10px] md:text-[11px] font-mono text-green-300 overflow-x-auto max-w-full max-h-24 bg-[#0a1410]/80">
                          <code>{msg.sessions.output}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Message Time */}
                <div className={`text-[9px] mt-0.5 text-right font-mono ${isMine ? 'text-primary/70' : 'text-dark-muted'}`}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-dark-surface border-t border-dark-border p-3 z-10 shrink-0">
        {!canSendMessages ? (
          <div className="flex items-center justify-center gap-2 bg-dark-bg border border-dark-border py-3 rounded-xl text-dark-muted text-sm font-sans">
            <ShieldAlert size={16} />
            <span>Only admins can send messages</span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
            <button 
              type="button"
              onClick={handleOpenSessionModal}
              className="p-3 text-dark-muted hover:text-primary transition-colors cursor-pointer shrink-0"
              title="Attach CodeVault Session"
            >
              <Paperclip size={20} />
            </button>
            <div className="flex-1 bg-dark-bg border border-dark-border rounded-2xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden flex items-center min-h-[44px]">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
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
          </form>
        )}
      </footer>

      {/* Session Selection Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
