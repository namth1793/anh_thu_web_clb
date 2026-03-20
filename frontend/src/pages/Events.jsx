import { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import api from '../utils/api';
import EventCard from '../components/common/EventCard';

const statusFilters = [
  { id: '',         label: 'Tất cả' },
  { id: 'upcoming', label: '🟢 Sắp diễn ra' },
  { id: 'ongoing',  label: '🔵 Đang diễn ra' },
  { id: 'past',     label: '⚫ Đã kết thúc' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('upcoming');
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await api.get(`/events?${params}`);
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [status]);

  return (
    <div className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl font-black text-slate-800 mb-2">Sự kiện CLB</h1>
      <p className="text-slate-500 mb-8">Khám phá và tham gia các sự kiện của các câu lạc bộ</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form
          onSubmit={(e) => { e.preventDefault(); fetchEvents(); }}
          className="relative flex-1"
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sự kiện..."
            className="input pl-10"
          />
        </form>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                status === f.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-semibold text-slate-600">Không có sự kiện</p>
          <p className="text-sm mt-1">Chưa có sự kiện nào phù hợp với bộ lọc hiện tại</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev, i) => (
            <EventCard key={ev.id} event={ev} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
