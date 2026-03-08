import { Link } from 'react-router-dom';
import { Users, ArrowRight, Sparkles } from 'lucide-react';

const categoryConfig = {
  technology: { color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Công nghệ', icon: '💻' },
  academic:   { color: 'from-green-500 to-emerald-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Học thuật', icon: '📚' },
  media:      { color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50', text: 'text-purple-700', label: 'Truyền thông', icon: '📸' },
  art:        { color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-700', label: 'Nghệ thuật', icon: '🎨' },
  sports:     { color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', text: 'text-orange-700', label: 'Thể thao', icon: '⚽' },
  community:  { color: 'from-teal-500 to-green-500', bg: 'bg-teal-50', text: 'text-teal-700', label: 'Cộng đồng', icon: '🤝' },
};

export default function ClubCard({ club, index = 0 }) {
  const cat = categoryConfig[club.category] || { color: 'from-indigo-500 to-violet-500', bg: 'bg-slate-50', text: 'text-slate-600', label: club.category, icon: '🏛️' };

  return (
    <Link
      to={`/clubs/${club.slug}`}
      className="card-hover card-glow group block"
    >
      {/* Banner */}
      <div className={`h-32 relative overflow-hidden ${!club.cover_image ? `bg-gradient-to-br ${cat.color}` : ''}`}>
        {club.cover_image ? (
          <img src={club.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Icon */}
        <div className="absolute bottom-3 left-4 w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
          {cat.icon}
        </div>

        {/* Featured badge */}
        {club.is_featured === 1 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 bg-amber-400/90 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Sparkles size={10} /> Nổi bật
            </span>
          </div>
        )}
      </div>

      {/* Category badge */}
      <div className="px-4 pt-3 flex justify-end">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}>
          {cat.label}
        </span>
      </div>

      <div className="px-4 pt-1 pb-4">
        <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors duration-200 line-clamp-1">
          {club.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{club.short_desc}</p>

        <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Users size={12} />
            <span>{club.member_count} thành viên</span>
          </div>
          <span className="text-indigo-500 text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 group-hover:text-indigo-700 transition-all duration-200">
            Chi tiết <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
