import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusConfig = {
  upcoming: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Sắp diễn ra' },
  ongoing:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Đang diễn ra' },
  past:     { bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400',   label: 'Đã kết thúc' },
};

export default function EventCard({ event, index = 0 }) {
  const sc = statusConfig[event.status] || statusConfig.past;
  const fmt = (d) => { try { return format(parseISO(d), 'dd/MM/yyyy HH:mm', { locale: vi }); } catch { return d; } };

  return (
    <Link to={`/events/${event.id}`} className="card group flex gap-0 overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 block">
      {/* Date sidebar */}
      <div className="shrink-0 w-16 bg-gradient-to-b from-indigo-600 to-violet-600 flex flex-col items-center justify-center text-white py-4 px-1">
        <span className="text-2xl font-black leading-none">
          {event.start_time ? format(parseISO(event.start_time), 'dd') : '--'}
        </span>
        <span className="text-xs font-medium uppercase opacity-80 mt-0.5">
          {event.start_time ? format(parseISO(event.start_time), 'MMM', { locale: vi }) : ''}
        </span>
      </div>

      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 flex-1 group-hover:text-indigo-600 transition-colors">
            {event.title}
          </h3>
          <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${event.status === 'ongoing' ? 'animate-pulse' : ''}`} />
            {sc.label}
          </span>
        </div>

        {event.club_name && (
          <Link to={`/clubs/${event.club_slug}`} className="inline-flex items-center gap-0.5 text-indigo-500 text-xs font-medium hover:text-indigo-700 hover:underline mt-1.5 transition-colors">
            {event.club_name} <ChevronRight size={10} />
          </Link>
        )}

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
          {event.start_time && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {fmt(event.start_time)}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 max-w-48 truncate">
              <MapPin size={11} /> {event.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
