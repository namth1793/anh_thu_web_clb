import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusConfig = {
  upcoming: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Sắp diễn ra' },
  ongoing:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Đang diễn ra' },
  past:     { bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400',   label: 'Đã kết thúc' },
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(({ data }) => { setEvent(data); })
      .catch(() => setError('Không tìm thấy sự kiện'))
      .finally(() => setLoading(false));

    if (user) {
      api.get(`/events/${id}/register-status`)
        .then(({ data }) => setRegistered(data.registered))
        .catch(() => {});
    }
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập để đăng ký');
    setRegistering(true);
    try {
      if (registered) {
        await api.delete(`/events/${id}/register`);
        setRegistered(false);
        toast.success('Đã huỷ đăng ký sự kiện');
      } else {
        await api.post(`/events/${id}/register`);
        setRegistered(true);
        toast.success('Đăng ký tham gia thành công!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally { setRegistering(false); }
  };

  const fmt = (d) => { try { return format(parseISO(d), 'dd/MM/yyyy HH:mm', { locale: vi }); } catch { return d; } };

  if (loading) return (
    <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-64 bg-slate-200 rounded" />
      </div>
    </div>
  );

  if (error) return (
    <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-xl font-semibold text-slate-700 mb-6">{error}</p>
      <button onClick={() => navigate('/events')} className="btn-primary">Quay lại sự kiện</button>
    </div>
  );

  const sc = statusConfig[event.status] || statusConfig.past;

  return (
    <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/events" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Quay lại sự kiện
      </Link>

      <article className="card p-6 sm:p-8">
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 ${sc.bg} ${sc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${event.status === 'ongoing' ? 'animate-pulse' : ''}`} />
          {sc.label}
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-snug mb-4">{event.title}</h1>

        {/* Club */}
        {event.club_name && (
          <Link to={`/clubs/${event.club_slug}`}
            className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-700 text-sm font-medium mb-5 transition-colors">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {event.club_name.charAt(0)}
            </div>
            {event.club_name} <ChevronRight size={12} />
          </Link>
        )}

        {/* Meta info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-slate-50 rounded-2xl text-sm">
          {event.start_time && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={15} className="text-indigo-500 shrink-0" />
              <span>Bắt đầu: <strong>{fmt(event.start_time)}</strong></span>
            </div>
          )}
          {event.end_time && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={15} className="text-indigo-500 shrink-0" />
              <span>Kết thúc: <strong>{fmt(event.end_time)}</strong></span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={15} className="text-indigo-500 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2 text-slate-600">
              <Users size={15} className="text-indigo-500 shrink-0" />
              <span>{event.registrations ?? 0} / {event.capacity} người đăng ký</span>
            </div>
          )}
        </div>

        {/* Image */}
        {event.image && (
          <img
            src={event.image}
            alt={event.title}
            className="w-full rounded-xl object-cover max-h-80 mb-6"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Description */}
        {event.description && (
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-6">
            {event.description}
          </div>
        )}

        {/* Register button */}
        {event.status !== 'past' && (
          <button
            onClick={handleRegister}
            disabled={registering}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              registered
                ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                : 'btn-primary'
            }`}
          >
            {registering ? 'Đang xử lý...' : registered ? 'Huỷ đăng ký' : 'Đăng ký tham gia'}
          </button>
        )}
      </article>
    </div>
  );
}