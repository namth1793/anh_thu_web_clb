import { useState, useEffect } from 'react';
import { Search, Trash2, Shield } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const roleColors = { admin: 'bg-red-100 text-red-700', leader: 'bg-amber-100 text-amber-700', student: 'bg-blue-100 text-blue-700' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [role]);

  const updateRole = async (id, newRole) => {
    try {
      await api.put(`/admin/users/${id}`, { role: newRole });
      toast.success('Đã cập nhật vai trò');
      fetchUsers();
    } catch { toast.error('Lỗi'); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Xóa tài khoản "${name}"?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Đã xóa tài khoản');
      fetchUsers();
    } catch { toast.error('Không thể xóa'); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Quản lý Người dùng</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} người dùng</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, email..." className="input pl-10" />
        </form>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {[{ id: '', label: 'Tất cả' }, { id: 'student', label: '🎓 Student' }, { id: 'leader', label: '🏆 Leader' }, { id: 'admin', label: '👑 Admin' }].map((f) => (
            <button key={f.id} onClick={() => setRole(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${role === f.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Người dùng', 'Ngành', 'Năm', 'Vai trò', 'Ngày tạo', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="py-3 px-4"><div className="h-6 bg-slate-200 rounded animate-pulse" /></td></tr>
                ))
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{u.major || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{u.year ? `N${u.year}` : '—'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className={`badge text-xs border-0 outline-none cursor-pointer ${roleColors[u.role]} font-semibold py-1`}
                    >
                      <option value="student">student</option>
                      <option value="leader">leader</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{u.created_at?.slice(0, 10)}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => remove(u.id, u.name)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
