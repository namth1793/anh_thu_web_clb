import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Headphones, ChevronDown } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { getSocket } = useSocket();
  const { user } = useAuth();
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const initChat = async () => {
    if (initialized) return;
    setInitialized(true);
    try {
      const { data } = await api.post('/messages/rooms', {
        user_id: user?.id || null,
        guest_name: user?.name || 'Khách',
      });
      setRoomId(data.id);
      const msgs = await api.get(`/messages/rooms/${data.id}/messages`);
      setMessages(msgs.data);

      const socket = getSocket();
      if (socket) {
        socket.emit('join_room', { roomId: data.id });
        socket.on('new_message', (msg) => {
          setMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]);
        });
        socket.on('user_typing', () => setTyping(true));
        socket.on('user_stop_typing', () => setTyping(false));
      }
    } catch {}
  };

  const handleOpen = () => {
    setOpen(true);
    initChat();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !roomId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { roomId, content: input, senderName: user?.name || 'Khách' });
    }
    setInput('');
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (socket && roomId) {
      socket.emit('typing', { roomId, name: user?.name || 'Khách' });
      clearTimeout(window._typingTimer);
      window._typingTimer = setTimeout(() => socket.emit('stop_typing', { roomId }), 1500);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: '#FBBF24' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F59E0B')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FBBF24')}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-fade-in-up" style={{ height: 460 }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Headphones size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Clubhub Support</p>
                  <p className="text-indigo-200 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                    Online – Hỗ trợ trực tiếp
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">
                <Headphones size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-slate-500">Chào mừng đến Clubhub Support!</p>
                <p className="text-xs mt-1">Đội ngũ hỗ trợ sẽ phản hồi trong giờ hành chính 8h–17h</p>
              </div>
            )}
            {messages.map((msg) => {
              const isAdmin = msg.is_admin;
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                  {isAdmin && (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                      <Headphones size={13} className="text-indigo-600" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isAdmin ? 'chat-bubble-admin' : 'chat-bubble-user'}`}>
                    {isAdmin && <p className="text-xs opacity-70 mb-1">{msg.sender_name || 'Clubhub'}</p>}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">{msg.created_at?.slice(11, 16)}</p>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Headphones size={13} className="text-indigo-600" />
                </div>
                <div className="bg-indigo-600 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTyping(); }}
              placeholder="Nhập tin nhắn hỗ trợ..."
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" disabled={!input.trim()} className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
