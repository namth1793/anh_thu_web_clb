import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Search, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusFilters = [
  { id: '', label: 'Tất cả' },
  { id: 'upcoming', label: '🟢 Sắp diễn ra' },
  { id: 'ongoing', label: '🔵 Đang diễn ra' },
  { id: 'past', label: '⚫ Đã kết thúc' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [registered, setRegistered] = useState({});
  const { user } = useAuth();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await api.get(`/events?${params}`);
      setEvents(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [status]);

  const toggleRegister = async (eventId) => {
    if (!user) return toast.error('Vui lòng đăng nhập để đăng ký sự kiện');
    try {
      if (registered[eventId]) {
        await api.delete(`/events/${eventId}/register`);
        setRegistered((p) => ({ ...p, [eventId]: false }));
        toast.success('Đã huỷ đăng ký');
      } else {
        await api.post(`/events/${eventId}/register`);
        setRegistered((p) => ({ ...p, [eventId]: true }));
        toast.success('Đăng ký thành công! 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const fmt = (d) => { try { return format(parseISO(d), 'EEEE, dd/MM/yyyy – HH:mm', { locale: vi }); } catch { return d; } };

  return (
    <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl font-black text-slate-800 mb-2">Sự kiện CLB</h1>
      <p className="text-slate-500 mb-8">Khám phá và tham gia các sự kiện của các câu lạc bộ</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form onSubmit={(e) => { e.preventDefault(); fetchEvents(); }} className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm sự kiện..." className="input pl-10" />
        </form>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {statusFilters.map((f) => (
            <button key={f.id} onClick={() => setStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${status === f.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-200" />)}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-semibold text-slate-600">Không có sự kiện</p>
          <p className="text-sm mt-1">Chưa có sự kiện nào phù hợp với bộ lọc hiện tại</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <div key={ev.id} className="card p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Date */}
                <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex flex-col items-center justify-center text-white">
                  <span className="text-xl sm:text-2xl font-black leading-none">
                    {ev.start_time ? format(parseISO(ev.start_time), 'dd') : '--'}
                  </span>
                  <span className="text-xs opacity-80">
                    {ev.start_time ? format(parseISO(ev.start_time), 'MMM', { locale: vi }) : ''}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-bold text-slate-800 text-lg flex-1">{ev.title}</h2>
                    <span className={`badge shrink-0 text-xs ${ev.status === 'upcoming' ? 'bg-green-100 text-green-700' : ev.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      {ev.status === 'upcoming' ? 'Sắp diễn ra' : ev.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </span>
                  </div>

                  <Link to={`/clubs/${ev.club_slug}`} className="text-indigo-600 text-sm font-medium hover:underline">
                    📌 {ev.club_name}
                  </Link>

                  <p className="text-slate-500 text-sm mt-2 line-clamp-2">{ev.description}</p>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                    {ev.start_time && <span className="flex items-center gap-1"><Clock size={12} /> {fmt(ev.start_time)}</span>}
                    {ev.location && <span className="flex items-center gap-1"><MapPin size={12} /> {ev.location}</span>}
                  </div>
                </div>

                {ev.status !== 'past' && (
                  <div className="shrink-0">
                    <button
                      onClick={() => toggleRegister(ev.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${registered[ev.id] ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'btn-primary'}`}
                    >
                      {registered[ev.id] ? <><CheckCircle size={15} /> Đã đăng ký</> : 'Đăng ký'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
