import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const POST_TYPES = ['news', 'achievement', 'recruitment', 'recap'];
const emptyForm = { club_id: '', title: '', content: '', type: 'news' };

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/posts').then((r) => setPosts(r.data)).catch(() => {});
    api.get('/clubs').then((r) => setClubs(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ club_id: p.club_id, title: p.title, content: p.content || '', type: p.type });
    setEditId(p.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await api.put(`/posts/${editId}`, form); toast.success('Đã cập nhật'); }
      else { await api.post('/posts', form); toast.success('Đã tạo bài viết'); }
      setShowForm(false);
      api.get('/admin/posts').then((r) => setPosts(r.data));
    } catch (err) { toast.error(err.response?.data?.error || 'Lỗi!'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa bài viết?')) return;
    try { await api.delete(`/posts/${id}`); toast.success('Đã xóa'); api.get('/admin/posts').then((r) => setPosts(r.data)); }
    catch { toast.error('Lỗi'); }
  };

  const typeColors = { news: 'bg-blue-100 text-blue-700', achievement: 'bg-amber-100 text-amber-700', recruitment: 'bg-green-100 text-green-700', recap: 'bg-purple-100 text-purple-700' };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Quản lý Bài viết</h1>
          <p className="text-slate-500 text-sm mt-1">{posts.length} bài viết</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Thêm bài viết</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Tiêu đề', 'CLB', 'Loại', 'Tác giả', 'Ngày', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-slate-800 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{p.content?.slice(0, 60)}...</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.club_name}</td>
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${typeColors[p.type] || 'bg-slate-100 text-slate-600'}`}>{p.type}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{p.author_name}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{p.created_at?.slice(0, 10)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => remove(p.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
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
              <h2 className="font-bold text-slate-800">{editId ? 'Chỉnh sửa bài viết' : 'Thêm bài viết'}</h2>
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
                <label className="text-sm font-medium text-slate-700 block mb-1">Tiêu đề *</label>
                <input value={form.title} onChange={set('title')} className="input" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Loại bài viết</label>
                <select value={form.type} onChange={set('type')} className="input">
                  {POST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Nội dung</label>
                <textarea value={form.content} onChange={set('content')} className="input min-h-32 resize-none" />
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
