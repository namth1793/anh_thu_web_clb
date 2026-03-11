import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../utils/api';

const typeFilters = [
  { id: '', label: 'Tất cả' },
  { id: 'news', label: '📰 Tin tức' },
  { id: 'achievement', label: '🏆 Thành tích' },
  { id: 'recruitment', label: '📢 Tuyển thành viên' },
  { id: 'recap', label: '📝 Recap sự kiện' },
];

const typeLabels = { news: '📰 Tin tức', achievement: '🏆 Thành tích', recruitment: '📢 Tuyển thành viên', recap: '📝 Recap' };
const typeColors = { news: 'bg-blue-100 text-blue-700', achievement: 'bg-amber-100 text-amber-700', recruitment: 'bg-green-100 text-green-700', recap: 'bg-purple-100 text-purple-700' };

export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (search) params.set('search', search);
      params.set('limit', '20');
      const { data } = await api.get(`/posts?${params}`);
      setPosts(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [type]);

  return (
    <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl font-black text-slate-800 mb-2">Tin tức & Hoạt động</h1>
      <p className="text-slate-500 mb-8">Cập nhật những hoạt động mới nhất từ các câu lạc bộ</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form onSubmit={(e) => { e.preventDefault(); fetchPosts(); }} className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm bài viết..." className="input pl-10" />
        </form>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
          {typeFilters.map((f) => (
            <button key={f.id} onClick={() => setType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${type === f.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-200" />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">📰</p>
          <p className="text-lg font-semibold text-slate-600">Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((p) => (
            <div key={p.id} className="card p-5 hover:shadow-md transition-shadow relative group">
              {/* Full-card link */}
              <Link to={`/news/${p.id}`} className="absolute inset-0 z-0" aria-label={p.title} />

              <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                <Link to={`/clubs/${p.club_slug}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {p.club_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-600">{p.club_name}</span>
                </Link>
                <span className={`badge text-xs ${typeColors[p.type] || 'bg-slate-100 text-slate-600'}`}>
                  {typeLabels[p.type] || p.type}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors relative z-10">{p.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed relative z-10">{p.content}</p>
              <p className="text-xs text-slate-400 mt-3 relative z-10">
                {p.author_name} · {p.created_at?.slice(0, 10)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
