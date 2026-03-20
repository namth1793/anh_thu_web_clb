import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Calendar, Mail, Facebook, Heart, CheckCircle, ChevronRight, Activity, Building2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/common/EventCard';
import PostCard from '../components/common/PostCard';
import toast from 'react-hot-toast';

const categoryConfig = {
  technology: { color: 'from-blue-600 to-cyan-500',   label: '💻 Công nghệ' },
  academic:   { color: 'from-green-600 to-emerald-500', label: '📚 Học thuật' },
  media:      { color: 'from-purple-600 to-violet-500', label: '📸 Truyền thông' },
  art:        { color: 'from-pink-600 to-rose-500',    label: '🎨 Nghệ thuật' },
  sports:     { color: 'from-orange-600 to-amber-500', label: '⚽ Thể thao' },
  community:  { color: 'from-teal-600 to-green-500',  label: '🤝 Cộng đồng' },
};

const TABS = ['Giới thiệu', 'Sự kiện', 'Tin tức', 'Đăng ký'];

export default function ClubDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Giới thiệu');
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null); // index of open image
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', major: user?.major || '', year: user?.year || '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/clubs/${slug}`).then((r) => {
      setClub(r.data);
      setLoading(false);
      api.get(`/clubs/${r.data.id}/images`).then((ir) => setImages(ir.data)).catch(() => {});
    }).catch(() => setLoading(false));
  }, [slug]);

  const toggleSave = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập để lưu CLB');
    try {
      const { data } = await api.post(`/clubs/${club.id}/save`);
      setSaved(data.saved);
      toast.success(data.saved ? 'Đã lưu CLB' : 'Đã bỏ lưu CLB');
    } catch {}
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.reason) return toast.error('Vui lòng điền đầy đủ thông tin');
    setSubmitting(true);
    try {
      await api.post('/applications', { club_id: club.id, ...form });
      toast.success('Nộp đơn thành công! Chúng tôi sẽ liên hệ sớm nhất 🎉');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="pt-24 max-w-5xl mx-auto px-4 space-y-4">
      <div className="h-48 bg-slate-200 rounded-3xl shimmer" />
      <div className="h-8 bg-slate-200 rounded-xl w-1/3 shimmer" />
      <div className="h-4 bg-slate-200 rounded-xl w-2/3 shimmer" />
    </div>
  );

  if (!club) return (
    <div className="pt-32 text-center text-slate-500">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-xl font-semibold">CLB không tồn tại</p>
      <Link to="/clubs" className="btn-primary mt-6 mx-auto">Quay lại danh sách</Link>
    </div>
  );

  const cat = categoryConfig[club.category] || { color: 'from-indigo-600 to-violet-500', label: club.category };
  const depts = (() => { try { return club.departments ? JSON.parse(club.departments) : []; } catch { return []; } })();

  return (
    <div className="pt-16">
      {/* Banner */}
      <div className={`h-56 md:h-72 relative overflow-hidden ${images.length === 0 ? `bg-gradient-to-br ${cat.color}` : ''}`}>
        {images.length > 0 ? (
          <img src={images[0].url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Club header card */}
        <div className="bg-white rounded-3xl shadow-xl -mt-16 md:-mt-20 p-6 md:p-8 relative z-10 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl shadow-lg shrink-0 overflow-hidden ${images.length === 0 ? `bg-gradient-to-br ${cat.color} flex items-center justify-center` : ''}`}>
              {images.length > 0
                ? <img src={images[0].url} alt={club.name} className="w-full h-full object-cover" />
                : <span className="text-4xl font-black text-white">{club.name?.charAt(0)}</span>
              }
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="badge bg-indigo-100 text-indigo-700 mb-2 inline-block">{cat.label}</span>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800">{club.name}</h1>
                  <p className="text-slate-500 mt-1">{club.short_desc}</p>
                </div>
                <button onClick={toggleSave} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${saved ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-500'}`}>
                  <Heart size={16} className={saved ? 'fill-red-500' : ''} />
                  {saved ? 'Đã lưu' : 'Lưu CLB'}
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Users size={14} className="text-indigo-500" />{club.member_count} thành viên</span>
                {club.founded_year && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" />Thành lập {club.founded_year}</span>}
                {club.contact_email && <a href={`mailto:${club.contact_email}`} className="flex items-center gap-1.5 hover:text-indigo-600"><Mail size={14} className="text-indigo-500" />{club.contact_email}</a>}
                {club.contact_fb && <a href={club.contact_fb} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 text-blue-500"><Facebook size={14} />Fanpage</a>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-16">

          {/* ── Giới thiệu ── */}
          {tab === 'Giới thiệu' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: main content */}
              <div className="md:col-span-2 space-y-5">

                {/* Club description */}
                <div className="card p-6">
                  <h2 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
                    Về {club.name}
                  </h2>
                  {club.contact_fb && (
                    <a href={club.contact_fb} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-sm font-medium mb-3 transition-colors">
                      <Facebook size={14} /> Theo dõi Fanpage <ChevronRight size={12} />
                    </a>
                  )}
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{club.description}</p>
                </div>

                {/* Activities */}
                {club.activities && (
                  <div className="card p-6">
                    <h2 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                      <Activity size={18} className="text-indigo-500" />
                      Các hoạt động
                    </h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{club.activities}</p>
                  </div>
                )}

                {/* Photo gallery */}
                {images.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
                      Hình ảnh CLB
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {images.map((img, i) => (
                        <button key={img.id} onClick={() => setLightbox(i)}
                          className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-400">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Departments */}
                {depts.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <Building2 size={18} className="text-indigo-500" />
                      Các ban
                    </h2>
                    <div className="space-y-4">
                      {depts.map((d, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{d.name}</p>
                            <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{d.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Leader card */}
              <div className="space-y-4">
                {club.leader_name && (
                  <div className="card p-6 text-center">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center text-white text-3xl font-black mx-auto mb-3`}>
                      {club.leader_name?.charAt(0)}
                    </div>
                    <p className="font-bold text-slate-800">{club.leader_name}</p>
                    <p className="text-sm text-indigo-600 font-medium mt-0.5">👑 Trưởng CLB</p>
                    {club.leader_major && <p className="text-xs text-slate-400 mt-1">{club.leader_major}</p>}
                    {club.leader_fb && (
                      <a href={club.leader_fb} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-sm font-medium mt-3 transition-colors">
                        <Facebook size={14} /> Xem Facebook <ChevronRight size={12} />
                      </a>
                    )}
                    <button onClick={() => setTab('Đăng ký')} className="btn-primary w-full justify-center mt-4 text-sm">
                      Đăng ký tham gia
                    </button>
                  </div>
                )}

                {/* Quick info */}
                <div className="card p-5 space-y-3 text-sm">
                  {club.founded_year && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Thành lập</span>
                      <span className="font-semibold text-slate-800">{club.founded_year}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Thành viên</span>
                    <span className="font-semibold text-slate-800">{club.member_count}</span>
                  </div>
                  {club.contact_email && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Email</span>
                      <a href={`mailto:${club.contact_email}`} className="font-medium text-indigo-600 hover:underline text-xs truncate">{club.contact_email}</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Sự kiện ── */}
          {tab === 'Sự kiện' && (
            <div>
              {club.events?.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                  <p>Chưa có sự kiện nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {club.events?.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
                </div>
              )}
            </div>
          )}

          {/* ── Tin tức ── */}
          {tab === 'Tin tức' && (
            <div>
              {club.posts?.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-4xl mb-3">📰</p>
                  <p>Chưa có bài viết nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {club.posts?.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
                </div>
              )}
            </div>
          )}

          {/* ── Đăng ký ── */}
          {tab === 'Đăng ký' && (
            <div className="max-w-lg mx-auto">
              {submitted ? (
                <div className="card p-10 text-center">
                  <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Đã nộp đơn thành công!</h3>
                  <p className="text-slate-500">Chúng tôi sẽ liên hệ với bạn qua email trong 3-5 ngày làm việc.</p>
                  <Link to="/clubs" className="btn-primary mt-6 mx-auto">Khám phá thêm CLB</Link>
                </div>
              ) : (
                <div className="card p-6">
                  <h2 className="font-bold text-slate-800 text-xl mb-1">Đăng ký tham gia {club.name}</h2>
                  <p className="text-slate-500 text-sm mb-6">Điền thông tin bên dưới để gửi đơn đăng ký</p>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Họ và tên *</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Nguyễn Văn A" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Email sinh viên *</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="ten.xx@fpt.edu.vn" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Ngành học</label>
                        <input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="input" placeholder="VD: CNTT" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Năm học</label>
                        <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input">
                          <option value="">Chọn năm</option>
                          {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Năm {y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Lý do muốn tham gia *</label>
                      <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        className="input min-h-28 resize-none" placeholder="Chia sẻ lý do bạn muốn tham gia CLB này..." required />
                    </div>
                    <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                      {submitting ? 'Đang nộp...' : 'Nộp đơn đăng ký'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          {lightbox > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 text-3xl"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}>‹</button>
          )}
          <img src={images[lightbox]?.url} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()} />
          {lightbox < images.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 text-3xl"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}>›</button>
          )}
          <p className="absolute bottom-4 text-white/50 text-sm">{lightbox + 1} / {images.length}</p>
        </div>
      )}
    </div>
  );
}
