import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['technology', 'academic', 'media', 'art', 'sports', 'community'];
const emptyForm = { name: '', slug: '', category: 'technology', short_desc: '', description: '', founded_year: new Date().getFullYear(), contact_email: '', contact_fb: '', is_featured: 0 };

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchClubs = () => api.get('/admin/clubs').then((r) => setClubs(r.data)).catch(() => {});

  useEffect(() => { fetchClubs(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (c) => {
    setForm({ name: c.name, slug: c.slug, category: c.category, short_desc: c.short_desc || '', description: c.description || '', founded_year: c.founded_year || '', contact_email: c.contact_email || '', contact_fb: c.contact_fb || '', is_featured: c.is_featured });
    setEditId(c.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/clubs/${editId}`, form);
        toast.success('Đã cập nhật CLB');
      } else {
        await api.post('/clubs', form);
        toast.success('Đã tạo CLB mới');
      }
      setShowForm(false);
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi!');
    } finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Xóa CLB "${name}"? Hành động này không thể hoàn tác!`)) return;
    try {
      await api.delete(`/clubs/${id}`);
      toast.success('Đã xóa CLB');
      fetchClubs();
    } catch { toast.error('Không thể xóa'); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Quản lý CLB</h1>
          <p className="text-slate-500 text-sm mt-1">{clubs.length} câu lạc bộ</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Thêm CLB</button>
      </div>

      {/* Club table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['CLB', 'Danh mục', 'Thành viên', 'Nổi bật', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clubs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {c.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><span className="badge bg-indigo-100 text-indigo-700 text-xs">{c.category}</span></td>
                  <td className="py-3 px-4 text-slate-600">{c.member_count}</td>
                  <td className="py-3 px-4">{c.is_featured ? <span className="text-amber-500">⭐</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(c.id, c.name)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">{editId ? 'Chỉnh sửa CLB' : 'Thêm CLB mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tên CLB *</label>
                <input value={form.name} onChange={set('name')} className="input" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Slug (URL) *</label>
                <input value={form.slug} onChange={set('slug')} className="input" placeholder="fpt-code-club" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Danh mục</label>
                <select value={form.category} onChange={set('category')} className="input">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Mô tả ngắn</label>
                <input value={form.short_desc} onChange={set('short_desc')} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Mô tả đầy đủ</label>
                <textarea value={form.description} onChange={set('description')} className="input min-h-24 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Năm thành lập</label>
                  <input type="number" value={form.founded_year} onChange={set('founded_year')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Nổi bật</label>
                  <select value={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: Number(e.target.value) })} className="input">
                    <option value={0}>Không</option>
                    <option value={1}>Có</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Email liên hệ</label>
                <input type="email" value={form.contact_email} onChange={set('contact_email')} className="input" />
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
