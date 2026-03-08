import { useState, useEffect } from 'react';
import { User, Heart, Calendar, FileText, Bell, Edit3, Save, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ClubCard from '../components/common/ClubCard';
import EventCard from '../components/common/EventCard';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile', label: 'Hồ sơ', icon: User },
  { id: 'saved', label: 'CLB đã lưu', icon: Heart },
  { id: 'applications', label: 'Đơn đăng ký', icon: FileText },
  { id: 'events', label: 'Sự kiện', icon: Calendar },
];

const statusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
const statusLabels = { pending: '⏳ Chờ duyệt', approved: '✅ Đã chấp nhận', rejected: '❌ Không được duyệt' };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', major: user?.major || '', year: user?.year || 1, bio: user?.bio || '' });
  const [savedClubs, setSavedClubs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (tab === 'saved') api.get('/clubs/me/saved').then((r) => setSavedClubs(r.data)).catch(() => {});
    if (tab === 'applications') api.get('/applications/me').then((r) => setApplications(r.data)).catch(() => {});
    if (tab === 'events') api.get('/events/me/registered').then((r) => setEvents(r.data)).catch(() => {});
  }, [tab]);

  const saveProfile = async () => {
    try {
      const { data } = await api.put('/auth/me', form);
      updateUser(data);
      setEditing(false);
      toast.success('Đã cập nhật hồ sơ');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  return (
    <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{user?.name}</h1>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className={`badge mt-1 inline-block text-xs ${user?.role === 'admin' ? 'bg-red-100 text-red-700' : user?.role === 'leader' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {user?.role === 'admin' ? '👑 Admin' : user?.role === 'leader' ? '🏆 Leader' : '🎓 Sinh viên'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800 text-lg">Thông tin cá nhân</h2>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm"><X size={15} /> Hủy</button>
                <button onClick={saveProfile} className="btn-primary text-sm"><Save size={15} /> Lưu</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm"><Edit3 size={15} /> Chỉnh sửa</button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Họ và tên</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Ngành học</label>
                  <input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="input" placeholder="VD: CNTT" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Năm học</label>
                  <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="input">
                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Năm {y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Giới thiệu bản thân</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input min-h-24 resize-none" placeholder="Một vài điều về bạn..." />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Họ và tên', value: user?.name },
                { label: 'Email', value: user?.email },
                { label: 'Ngành học', value: user?.major || '—' },
                { label: 'Năm học', value: user?.year ? `Năm ${user.year}` : '—' },
                { label: 'Giới thiệu', value: user?.bio || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4">
                  <span className="text-sm text-slate-400 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-slate-800 font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved clubs */}
      {tab === 'saved' && (
        <div>
          {savedClubs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Heart size={40} className="mx-auto mb-3 opacity-40" />
              <p>Chưa có CLB nào được lưu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedClubs.map((c) => <ClubCard key={c.id} club={c} />)}
            </div>
          )}
        </div>
      )}

      {/* Applications */}
      {tab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText size={40} className="mx-auto mb-3 opacity-40" />
              <p>Chưa có đơn đăng ký nào</p>
            </div>
          ) : applications.map((a) => (
            <div key={a.id} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0">
                {a.club_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{a.club_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.created_at?.slice(0, 10)}</p>
                {a.reason && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{a.reason}</p>}
              </div>
              <span className={`badge text-xs shrink-0 ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Events */}
      {tab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-40" />
              <p>Chưa đăng ký sự kiện nào</p>
            </div>
          ) : events.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}
