import { Link } from 'react-router-dom';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusConfig = {
  upcoming: { bg: 'bg-emerald-500', label: 'Sắp diễn ra', pulse: false },
  ongoing:  { bg: 'bg-blue-500',    label: 'Đang diễn ra', pulse: true },
  past:     { bg: 'bg-slate-400',   label: 'Đã kết thúc',  pulse: false },
};

const fallbackGradients = [
  'from-indigo-600 to-violet-600',
  'from-blue-600 to-cyan-500',
  'from-purple-600 to-pink-500',
  'from-emerald-600 to-teal-500',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-500',
];

export default function EventCard({ event, index = 0 }) {
  const sc = statusConfig[event.status] || statusConfig.past;
  const gradient = fallbackGradients[index % fallbackGradients.length];

  const day   = event.start_time ? format(parseISO(event.start_time), 'dd') : '--';
  const month = event.start_time ? format(parseISO(event.start_time), 'MMM', { locale: vi }) : '';
  const time  = event.start_time ? format(parseISO(event.start_time), 'HH:mm · dd/MM', { locale: vi }) : '';

  return (
    <Link
      to={`/events/${event.id}`}
      className="card group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      {/* ── Cover image ── */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 shrink-0">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Calendar size={36} className="text-white/30" />
          </div>
        )}

        {/* Status badge – top right */}
        <span className={`absolute top-2 right-2 ${sc.bg} text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow`}>
          {sc.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {sc.label}
        </span>

        {/* Date chip – bottom left */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center shadow-md min-w-[44px]">
          <p className="text-lg font-black text-slate-800 leading-none">{day}</p>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">{month}</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
          {event.title}
        </h3>

        {event.club_name && (
          <p className="text-indigo-500 text-xs font-medium truncate">📌 {event.club_name}</p>
        )}

        <div className="mt-auto pt-2 flex flex-col gap-1 text-xs text-slate-400">
          {time && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="shrink-0" /> {time}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
