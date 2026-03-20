import { Link } from 'react-router-dom';
import { Calendar, User, FileText } from 'lucide-react';

const typeLabels = {
  news:        '📰 Tin tức',
  achievement: '🏆 Thành tích',
  recruitment: '📢 Tuyển thành viên',
  recap:       '📝 Recap',
};
const typeColors = {
  news:        'bg-blue-100 text-blue-700',
  achievement: 'bg-amber-100 text-amber-700',
  recruitment: 'bg-green-100 text-green-700',
  recap:       'bg-purple-100 text-purple-700',
};
const fallbackGradients = [
  'from-indigo-600 to-violet-600',
  'from-blue-600 to-cyan-500',
  'from-purple-600 to-pink-500',
  'from-emerald-600 to-teal-500',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-500',
];

export default function PostCard({ post, index = 0 }) {
  const gradient = fallbackGradients[index % fallbackGradients.length];

  return (
    <Link
      to={`/news/${post.id}`}
      className="card group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      {/* ── Cover image ── */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 shrink-0">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <FileText size={36} className="text-white/30" />
          </div>
        )}

        {/* Type badge – top left */}
        <span className={`absolute top-2 left-2 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow ${typeColors[post.type] || 'bg-slate-100 text-slate-600'}`}>
          {typeLabels[post.type] || post.type}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {post.club_name && (
          <p className="text-indigo-500 text-xs font-medium truncate">📌 {post.club_name}</p>
        )}

        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
          {post.title}
        </h3>

        {post.content && (
          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{post.content}</p>
        )}

        <div className="mt-auto pt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          {post.author_name && (
            <span className="flex items-center gap-1">
              <User size={10} /> {post.author_name}
            </span>
          )}
          {post.created_at && (
            <span className="flex items-center gap-1">
              <Calendar size={10} /> {post.created_at.slice(0, 10)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
