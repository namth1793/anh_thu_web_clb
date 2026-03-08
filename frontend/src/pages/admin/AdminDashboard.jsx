import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, FileText, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState({ title: '', content: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/admin/stats').then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data: res } = await api.post('/admin/broadcast', broadcast);
      alert(res.message);
      setBroadcast({ title: '', content: '' });
    } finally { setSending(false); }
  };

  const statCards = data ? [
    { label: 'Câu lạc bộ', value: data.stats.clubs, icon: Trophy, color: 'from-indigo-500 to-violet-500', link: '/admin/clubs' },
    { label: 'Sinh viên', value: data.stats.students, icon: Users, color: 'from-blue-500 to-cyan-500', link: '/admin/users' },
    { label: 'Sự kiện', value: data.stats.events, icon: Calendar, color: 'from-green-500 to-emerald-500', link: '/admin/events' },
    { label: 'Đơn chờ duyệt', value: data.stats.pendingApplications, icon: FileText, color: 'from-amber-500 to-orange-500', link: '/admin/applications' },
  ] : [];

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan hệ thống CLB FPT Đà Nẵng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="card p-5 hover:scale-105 transition-transform">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clubs */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-500" />
            <h2 className="font-bold text-slate-800">CLB Nhiều thành viên nhất</h2>
          </div>
          <div className="space-y-3">
            {data?.topClubs?.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{c.name}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.member_count / (data.topClubs[0]?.member_count || 1)) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-600 shrink-0">{c.member_count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-green-500" />
            <h2 className="font-bold text-slate-800">Sự kiện sắp tới</h2>
          </div>
          <div className="space-y-3">
            {data?.upcomingEvents?.map((e, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                  {e.start_time?.slice(8, 10)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
                  <p className="text-xs text-slate-400">{e.club_name} · {e.start_time?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent applications */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Đơn đăng ký gần đây</h2>
          <Link to="/admin/applications" className="text-indigo-600 text-sm font-medium hover:underline">Xem tất cả</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Tên', 'CLB', 'Email', 'Ngày', 'Trạng thái'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-slate-400 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recentApps?.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-800">{a.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{a.club_name}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">{a.email}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs">{a.created_at?.slice(0, 10)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`badge text-xs ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {a.status === 'approved' ? 'Đã duyệt' : a.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast */}
      <div className="card p-5">
        <h2 className="font-bold text-slate-800 mb-4">📢 Gửi thông báo tới tất cả sinh viên</h2>
        <form onSubmit={sendBroadcast} className="space-y-3">
          <input
            value={broadcast.title}
            onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
            className="input"
            placeholder="Tiêu đề thông báo"
            required
          />
          <textarea
            value={broadcast.content}
            onChange={(e) => setBroadcast({ ...broadcast, content: e.target.value })}
            className="input min-h-20 resize-none"
            placeholder="Nội dung thông báo..."
            required
          />
          <button type="submit" disabled={sending} className="btn-primary text-sm">
            {sending ? 'Đang gửi...' : '📤 Gửi thông báo'}
          </button>
        </form>
      </div>
    </div>
  );
}
