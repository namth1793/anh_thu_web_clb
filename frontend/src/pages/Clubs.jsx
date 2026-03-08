import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import api from '../utils/api';
import ClubCard from '../components/common/ClubCard';

const CATEGORIES = [
  { id: '', label: 'Tất cả' },
  { id: 'technology', label: '💻 Công nghệ' },
  { id: 'academic', label: '📚 Học thuật' },
  { id: 'media', label: '📸 Truyền thông' },
  { id: 'art', label: '🎨 Nghệ thuật' },
  { id: 'sports', label: '⚽ Thể thao' },
  { id: 'community', label: '🤝 Cộng đồng' },
];

export default function Clubs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const { data } = await api.get(`/clubs?${params}`);
      setClubs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClubs(); }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  const setFilter = (cat) => {
    setCategory(cat);
    setSearchParams(cat ? { category: cat } : {});
  };

  const clearSearch = () => { setSearch(''); fetchClubs(); };

  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-8 animate-fade-in-down">
        <h1 className="text-3xl font-black text-slate-800">Tất cả Câu lạc bộ</h1>
        <p className="text-slate-500 mt-1">Tìm CLB phù hợp với sở thích và mục tiêu của bạn</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên CLB..."
            className="input pl-11 pr-10"
          />
          {search && (
            <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          )}
        </form>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
          <Filter size={15} className="text-slate-400 ml-2 shrink-0" />
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${category === c.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-56 shimmer" />)}
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-20 text-slate-400 animate-scale-in">
          <div className="text-6xl mb-4 animate-float">🔍</div>
          <h3 className="text-xl font-semibold text-slate-600">Không tìm thấy CLB</h3>
          <p className="mt-2">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>
          <button onClick={() => { setSearch(''); setCategory(''); }} className="btn-primary mt-6 mx-auto">
            Xem tất cả CLB
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4 animate-fade-in-down">Tìm thấy <strong className="text-indigo-600">{clubs.length}</strong> câu lạc bộ</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {clubs.map((club, i) => <ClubCard key={club.id} club={club} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
