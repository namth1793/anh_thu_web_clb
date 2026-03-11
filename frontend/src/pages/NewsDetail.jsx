import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import api from '../utils/api';

const typeLabels = { news: '📰 Tin tức', achievement: '🏆 Thành tích', recruitment: '📢 Tuyển thành viên', recap: '📝 Recap' };
const typeColors = { news: 'bg-blue-100 text-blue-700', achievement: 'bg-amber-100 text-amber-700', recruitment: 'bg-green-100 text-green-700', recap: 'bg-purple-100 text-purple-700' };

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => setError('Không tìm thấy bài viết'))
      .finally(() => setLoading(false));
  }, [id]);

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
      <button onClick={() => navigate('/news')} className="btn-primary">Quay lại tin tức</button>
    </div>
  );

  return (
    <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6">
      {/* Back */}
      <Link to="/news" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Quay lại tin tức
      </Link>

      <article className="card p-6 sm:p-8">
        {/* Type badge */}
        <span className={`badge text-xs mb-4 inline-block ${typeColors[post.type] || 'bg-slate-100 text-slate-600'}`}>
          {typeLabels[post.type] || post.type}
        </span>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-snug mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
          <Link to={`/clubs/${post.club_slug}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {post.club_name?.charAt(0)}
            </div>
            <span className="font-medium">{post.club_name}</span>
          </Link>
          {post.author_name && (
            <span className="flex items-center gap-1.5">
              <User size={13} /> {post.author_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> {post.created_at?.slice(0, 10)}
          </span>
        </div>

        {/* Image */}
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="w-full rounded-xl object-cover max-h-80 mb-6"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Content */}
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </article>
    </div>
  );
}
