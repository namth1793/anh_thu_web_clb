import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../utils/api';
import ClubCard from '../components/common/ClubCard';

const CATEGORY_INFO = {
  technology: { label: 'Công nghệ', icon: '💻', desc: 'Lập trình, AI, Robotics, IoT và công nghệ tương lai', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 border-blue-200' },
  academic: { label: 'Học thuật', icon: '📚', desc: 'Tiếng Anh, Marketing, Cờ vua, kỹ năng học thuật', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 border-green-200' },
  media: { label: 'Truyền thông', icon: '📸', desc: 'Nhiếp ảnh, làm phim, thiết kế, mạng xã hội', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50 border-purple-200' },
  art: { label: 'Nghệ thuật', icon: '🎨', desc: 'Thiết kế đồ họa, âm nhạc, hội họa, sáng tạo', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50 border-pink-200' },
  sports: { label: 'Thể thao', icon: '⚽', desc: 'Bóng đá, cầu lông, bơi lội, thể dục thể thao', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50 border-orange-200' },
  community: { label: 'Cộng đồng', icon: '🤝', desc: 'Tình nguyện, môi trường, hỗ trợ cộng đồng', color: 'from-teal-500 to-green-500', bg: 'bg-teal-50 border-teal-200' },
};

export default function Categories() {
  const [selected, setSelected] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.get('/clubs/meta/categories').then((r) => {
      const c = {};
      r.data.forEach((item) => { c[item.category] = item.count; });
      setCounts(c);
    }).catch(() => {});
  }, []);

  const handleSelect = async (catId) => {
    if (selected === catId) { setSelected(null); setClubs([]); return; }
    setSelected(catId);
    setLoading(true);
    try {
      const { data } = await api.get(`/clubs?category=${catId}`);
      setClubs(data);
    } finally { setLoading(false); }
  };

  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl font-black text-slate-800 mb-2">Danh mục CLB</h1>
      <p className="text-slate-500 mb-10">Chọn lĩnh vực bạn quan tâm để xem các câu lạc bộ phù hợp</p>

      {/* Category grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-12">
        {Object.entries(CATEGORY_INFO).map(([id, info]) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={`card p-6 text-left transition-all hover:scale-102 cursor-pointer border-2 ${selected === id ? `${info.bg} border-current` : 'border-transparent hover:border-slate-200'}`}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center text-3xl mb-4`}>
              {info.icon}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{info.label}</h3>
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{info.desc}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-semibold text-slate-400">{counts[id] || 0} CLB</span>
              <ArrowRight size={16} className={`transition-transform ${selected === id ? 'rotate-90 text-indigo-600' : 'text-slate-300'}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Club list for selected category */}
      {selected && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CATEGORY_INFO[selected]?.color} flex items-center justify-center text-xl`}>
              {CATEGORY_INFO[selected]?.icon}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-xl">CLB {CATEGORY_INFO[selected]?.label}</h2>
              <p className="text-slate-400 text-sm">{clubs.length} câu lạc bộ</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => <div key={i} className="card h-52 animate-pulse bg-slate-200" />)}
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Chưa có CLB nào trong danh mục này</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {clubs.map((c) => <ClubCard key={c.id} club={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
