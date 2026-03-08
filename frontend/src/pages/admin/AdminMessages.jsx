import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminMessages() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { getSocket } = useSocket();
  const { user } = useAuth();
  const bottomRef = useRef();

  useEffect(() => {
    api.get('/messages/rooms').then((r) => setRooms(r.data)).catch(() => {});
    const socket = getSocket();
    if (socket) {
      socket.emit('admin_join_all');
      socket.on('room_activity', ({ roomId }) => {
        api.get('/messages/rooms').then((r) => setRooms(r.data)).catch(() => {});
      });
    }
    return () => { socket?.off('room_activity'); };
  }, []);

  const openRoom = async (room) => {
    setSelectedRoom(room);
    const { data } = await api.get(`/messages/rooms/${room.id}/messages`);
    setMessages(data);
    const socket = getSocket();
    if (socket) {
      socket.emit('join_room', { roomId: room.id });
      socket.off('new_message');
      socket.on('new_message', (msg) => {
        if (msg.room_id === room.id) {
          setMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]);
        }
      });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedRoom) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { roomId: selectedRoom.id, content: input, senderName: user?.name });
    }
    setInput('');
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const closeRoom = async (roomId) => {
    try {
      await api.put(`/messages/rooms/${roomId}/close`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (selectedRoom?.id === roomId) { setSelectedRoom(null); setMessages([]); }
    } catch {}
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-black text-slate-800 mb-6">Quản lý Tin nhắn</h1>
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Room list */}
        <div className="w-72 shrink-0 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
            Cuộc trò chuyện ({rooms.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {rooms.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
                Chưa có cuộc trò chuyện
              </div>
            ) : rooms.map((r) => (
              <div
                key={r.id}
                onClick={() => openRoom(r)}
                className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedRoom?.id === r.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(r.user_name || 'K')?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.user_name || 'Khách'}</p>
                      <p className="text-xs text-slate-400 truncate">{r.last_message || 'Bắt đầu cuộc trò chuyện'}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeRoom(r.id); }}
                    className="p-1 hover:bg-red-100 text-red-400 rounded-lg shrink-0"
                    title="Đóng"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
          {selectedRoom ? (
            <>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {(selectedRoom.user_name || 'K')?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{selectedRoom.user_name || 'Khách'}</p>
                  {selectedRoom.user_email && <p className="text-xs text-slate-400">{selectedRoom.user_email}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                    {!m.is_admin && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">
                        {(m.sender_name || 'K')?.charAt(0)}
                      </div>
                    )}
                    <div className={`max-w-sm ${m.is_admin ? 'chat-bubble-admin' : 'chat-bubble-user'}`}>
                      {!m.is_admin && <p className="text-xs opacity-60 mb-1">{m.sender_name}</p>}
                      <p>{m.content}</p>
                      <p className="text-xs opacity-50 mt-1">{m.created_at?.slice(11, 16)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  className="flex-1 input text-sm"
                />
                <button type="submit" disabled={!input.trim()} className="btn-primary text-sm shrink-0">
                  <Send size={15} /> Gửi
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
