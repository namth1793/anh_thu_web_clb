import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Users, Calendar, Trophy, Zap, Sparkles, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import ClubCard from '../components/common/ClubCard';
import EventCard from '../components/common/EventCard';

const categoryCards = [
  { id: 'technology', label: 'Công nghệ', icon: '💻', color: 'from-blue-500 to-cyan-400',    desc: 'Lập trình · AI · Robotics' },
  { id: 'academic',   label: 'Học thuật',  icon: '📚', color: 'from-green-500 to-emerald-400', desc: 'English · Marketing · Chess' },
  { id: 'media',      label: 'Truyền thông',icon: '📸', color: 'from-purple-500 to-violet-400', desc: 'Nhiếp ảnh · Video · PR' },
  { id: 'art',        label: 'Nghệ thuật', icon: '🎨', color: 'from-pink-500 to-rose-400',    desc: 'Thiết kế · Âm nhạc · Dance' },
  { id: 'sports',     label: 'Thể thao',   icon: '⚽', color: 'from-orange-500 to-amber-400', desc: 'Bóng đá · Cầu lông · Bơi' },
  { id: 'community',  label: 'Cộng đồng',  icon: '🤝', color: 'from-teal-500 to-green-400',  desc: 'Tình nguyện · Môi trường' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [stats, setStats] = useState({ clubs: 0, totalMembers: 0, events: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // Stats chính xác từ DB
    api.get('/public/stats').then((r) => {
      setStats(r.data.stats);
    }).catch(() => {});
    // Featured clubs để hiển thị grid
    api.get('/clubs').then((r) => {
      const all = r.data;
      const featured = all.filter((c) => c.is_featured).slice(0, 4);
      setFeaturedClubs(featured.length > 0 ? featured : all.slice(0, 4));
    }).catch(() => {});
    // Upcoming events cho carousel
    api.get('/events/upcoming').then((r) => {
      setUpcomingEvents(r.data);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/clubs?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="pt-16">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero text-white py-24 md:py-36">
        {/* Floating orbs */}
        <div className="orb w-80 h-80 bg-violet-600/40 top-[-60px] left-[-80px]" style={{ animationDelay: '0s' }} />
        <div className="orb w-96 h-96 bg-indigo-500/30 bottom-[-80px] right-[-100px]" style={{ animationDelay: '2s' }} />
        <div className="orb w-48 h-48 bg-purple-400/25 top-1/2 left-1/3" style={{ animationDelay: '4s' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Pill label */}
          <div className="animate-fade-in-down inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-7 border border-white/20">
            <Zap size={13} className="text-amber-400" />
            <span className="text-white/90">FPT University Đà Nẵng – Câu Lạc Bộ Sinh Viên</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-4xl md:text-6xl font-black leading-tight mb-6">
            Bứt phá &amp; Tỏa sáng{' '}
            <span className="gradient-text-animated">cùng CLB</span>
            <br />
            dành riêng cho bạn 🔥
          </h1>

          <p className="animate-fade-in-up delay-100 text-indigo-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Hơn <strong className="text-white">{stats?.clubs || '...'}</strong> câu lạc bộ đang chờ đón bạn. Học kỹ năng, kết bạn, trải nghiệm và phát triển bản thân cùng cộng đồng sinh viên FPT Đà Nẵng.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="animate-fade-in-up delay-200 flex gap-2 max-w-xl mx-auto mb-10">
            <div className="flex-1 relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên CLB, lĩnh vực..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xl text-sm"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap">
              Tìm kiếm
            </button>
          </form>

          {/* CTA buttons */}
          <div className="animate-fade-in-up delay-300 flex flex-wrap gap-3 justify-center">
            <Link to="/clubs" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Xem tất cả CLB <ArrowRight size={16} />
            </Link>
            <Link to="/suggest" className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-white/10 transition-all">
              <Sparkles size={16} className="text-amber-400" /> Gợi ý CLB cho tôi
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { icon: Trophy,    color: 'text-amber-500', bg: 'bg-amber-50', value: stats?.clubs ? `${stats.clubs}+` : '...',               label: 'Câu lạc bộ', delay: '0s' },
              { icon: Users,     color: 'text-indigo-500', bg: 'bg-indigo-50', value: stats?.totalMembers ? `${stats.totalMembers}+` : '...',  label: 'Thành viên', delay: '0.1s' },
              { icon: Calendar,  color: 'text-emerald-500', bg: 'bg-emerald-50', value: stats?.events ? `${stats.events}+` : '...',            label: 'Sự kiện/năm', delay: '0.2s' },
            ].map(({ icon: Icon, color, bg, value, label, delay }) => (
              <div key={label} className="animate-scale-in" style={{ animationDelay: delay }}>
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon size={22} className={color} />
                </div>
                <div className="text-3xl md:text-4xl font-black text-slate-800">{value}</div>
                <div className="text-sm text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events Carousel ─────────────────── */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-left">
              <h2 className="section-title">Sự kiện sắp diễn ra</h2>
              <p className="text-slate-500 mt-1 text-sm">Đừng bỏ lỡ những hoạt động thú vị</p>
            </div>
            <Link to="/events" className="btn-ghost hidden md:flex animate-fade-in-right">
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-24 shimmer" />)}
          </div>
        ) : (
          <div className="relative">
            {/* Fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white to-transparent" />

            <div
              className="flex items-stretch gap-4 w-max px-4"
              style={{ animation: 'carousel-ltr 45s linear infinite' }}
              onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
              onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
            >
              {[...upcomingEvents, ...upcomingEvents].map((ev, i) => (
                <div key={`${ev.id}-${i}`} className="w-80 shrink-0">
                  <EventCard event={ev} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/events" className="btn-secondary mx-auto">
            Xem tất cả sự kiện <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-fade-in-left">
            <h2 className="section-title">Khám phá theo lĩnh vực</h2>
            <p className="text-slate-500 mt-1 text-sm">Tìm CLB theo sở thích của bạn</p>
          </div>
          <Link to="/categories" className="btn-ghost hidden md:flex animate-fade-in-right">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryCards.map((c, i) => (
            <Link
              key={c.id}
              to={`/clubs?category=${c.id}`}
              className="group card card-glow p-5 text-center cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className={`w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-md`}>
                {c.icon}
              </div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">{c.label}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Clubs ───────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-fade-in-left">
              <h2 className="section-title">CLB Nổi bật</h2>
              <p className="text-slate-500 mt-1 text-sm">Các câu lạc bộ được sinh viên yêu thích nhất</p>
            </div>
            <Link to="/clubs" className="btn-secondary hidden md:flex text-sm animate-fade-in-right">
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>

          {featuredClubs.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card h-56 shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredClubs.map((club, i) => <ClubCard key={club.id} club={club} index={i} />)}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/clubs" className="btn-primary mx-auto animate-bounce-in" style={{ animationDelay: '0.5s' }}>
              Khám phá tất cả CLB <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Join ─────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden relative">
        <div className="orb w-64 h-64 bg-indigo-500/20 top-0 right-0" style={{ animationDelay: '1s' }} />
        <div className="orb w-48 h-48 bg-violet-500/20 bottom-0 left-0" style={{ animationDelay: '3s' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
              <TrendingUp size={13} className="text-amber-400" />
              <span className="text-white/80">Tại sao nên tham gia CLB?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black">Phát triển bản thân toàn diện</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🚀', title: 'Kỹ năng thực chiến', desc: 'Rèn luyện kỹ năng mềm, leadership và chuyên môn qua các dự án thực tế.', delay: '0s' },
              { icon: '🤝', title: 'Mạng lưới kết nối', desc: 'Gặp gỡ những người bạn cùng đam mê, mentor và cộng đồng doanh nghiệp.', delay: '0.1s' },
              { icon: '🏆', title: 'Hồ sơ ấn tượng', desc: 'Thành tích CLB là điểm cộng lớn trong CV khi xin việc sau tốt nghiệp.', delay: '0.2s' },
            ].map((item) => (
              <div key={item.title} className="glass rounded-2xl p-6 text-center animate-fade-in-up" style={{ animationDelay: item.delay }}>
                <div className="text-4xl mb-4 animate-float" style={{ animationDelay: item.delay }}>{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white animate-gradient">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="animate-bounce-in">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Bạn đang hoang mang chưa biết mình sẽ phù hợp CLB nào?</h2>
            <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
              Bạn đang không thoải mái trong việc lựa chọn CLB. Hãy làm bài quiz này để chúng tôi gợi ý CLB phù hợp với bạn.
            </p>
            <Link to="/suggest" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-2xl hover:-translate-y-1 hover:shadow-white/20 text-lg">
              <Sparkles size={20} className="text-amber-500" /> Bắt đầu khám phá
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
