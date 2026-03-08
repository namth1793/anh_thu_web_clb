import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { club_id: '', title: '', description: '', start_time: '', end_time: '', location: '', status: 'upcoming' };

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/events').then((r) => setEvents(r.data)).catch(() => {});
    api.get('/clubs').then((r) => setClubs(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (ev) => {
    setForm({
      club_id: ev.club_id, title: ev.title, description: ev.description || '',
      start_time: ev.start_time?.replace(' ', 'T') || '',
      end_time: ev.end_time?.replace(' ', 'T') || '',
      location: ev.location || '', status: ev.status,
    });
    setEditId(ev.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, start_time: form.start_time.replace('T', ' '), end_time: form.end_time.replace('T', ' ') };
    try {
      if (editId) { await api.put(`/events/${editId}`, payload); toast.success('Đã cập nhật'); }
      else { await api.post('/events', payload); toast.success('Đã tạo sự kiện'); }
      setShowForm(false);
      api.get('/admin/events').then((r) => setEvents(r.data));
    } catch (err) { toast.error(err.response?.data?.error || 'Lỗi!'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa sự kiện này?')) return;
    try { await api.delete(`/events/${id}`); toast.success('Đã xóa'); api.get('/admin/events').then((r) => setEvents(r.data)); }
    catch { toast.error('Không thể xóa'); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Quản lý Sự kiện</h1>
          <p className="text-slate-500 text-sm mt-1">{events.length} sự kiện</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Thêm sự kiện</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Sự kiện', 'CLB', 'Thời gian', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{ev.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-64">{ev.location}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{ev.club_name}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{ev.start_time?.slice(0, 16)}</td>
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${ev.status === 'upcoming' ? 'bg-green-100 text-green-700' : ev.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(ev)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => remove(ev.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">{editId ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">CLB *</label>
                <select value={form.club_id} onChange={set('club_id')} className="input" required>
                  <option value="">Chọn CLB</option>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tên sự kiện *</label>
                <input value={form.title} onChange={set('title')} className="input" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Mô tả</label>
                <textarea value={form.description} onChange={set('description')} className="input min-h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Bắt đầu</label>
                  <input type="datetime-local" value={form.start_time} onChange={set('start_time')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Kết thúc</label>
                  <input type="datetime-local" value={form.end_time} onChange={set('end_time')} className="input" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Địa điểm</label>
                <input value={form.location} onChange={set('location')} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Trạng thái</label>
                <select value={form.status} onChange={set('status')} className="input">
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="ongoing">Đang diễn ra</option>
                  <option value="past">Đã kết thúc</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
