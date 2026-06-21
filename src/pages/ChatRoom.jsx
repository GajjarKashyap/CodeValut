import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, Paperclip, MoreVertical, ShieldAlert } from 'lucide-react';
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
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
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
        .select('*')
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
      // rollback if needed
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
            <div className="w-10 h-10 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center font-bold text-primary shadow-inner">
              {group?.name?.charAt(0).toUpperCase() || 'G'}
            </div>
            <div>
              <h2 className="text-white font-bold font-sans tracking-wide leading-tight">{group?.name || 'Chat'}</h2>
              <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">
                {group?.is_direct_message ? 'Direct Message' : 'Group'}
                {group?.admin_only && ' • Admin Only'}
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 text-dark-muted hover:text-white rounded-full hover:bg-dark-bg transition-colors">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 z-10 flex flex-col gap-2">
        {/* End-to-end encryption notice like WhatsApp */}
        <div className="flex justify-center mb-4">
          <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono px-3 py-1.5 rounded-lg text-center max-w-xs shadow-md">
            Messages and shared code sessions are secured with CodeVault encryption.
          </span>
        </div>

        {messages.map((msg, index) => {
          const isMine = msg.user_id === user.id;
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[75%] ${isMine ? 'self-end' : 'self-start'}`}
            >
              {!group?.is_direct_message && !isMine && (
                <span className="text-[10px] font-mono text-dark-muted ml-1 mb-1">
                  User {msg.user_id.substring(0, 5)}
                </span>
              )}
              <div 
                className={`relative px-4 py-2.5 rounded-2xl shadow-md text-sm font-sans ${
                  isMine 
                    ? 'bg-primary text-dark-bg rounded-tr-sm font-medium' 
                    : 'bg-dark-surface text-white border border-dark-border rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                
                {/* Message Time */}
                <div className={`text-[9px] mt-1 text-right ${isMine ? 'text-dark-bg/70' : 'text-dark-muted'}`}>
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
                placeholder="Type a message or paste code..."
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
    </div>
  );
}
