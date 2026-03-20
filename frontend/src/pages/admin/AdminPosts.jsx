import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, Upload, Image } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const POST_TYPES = ['news', 'achievement', 'recruitment', 'recap'];
const TYPE_LABELS = { news: 'Tin tức', achievement: 'Thành tích', recruitment: 'Tuyển thành viên', recap: 'Recap' };
const emptyForm = { club_id: '', title: '', content: '', type: 'news' };

const typeColors = {
  news:        'bg-blue-100 text-blue-700',
  achievement: 'bg-amber-100 text-amber-700',
  recruitment: 'bg-green-100 text-green-700',
  recap:       'bg-purple-100 text-purple-700',
};

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchPosts = () => api.get('/admin/posts').then((r) => setPosts(r.data)).catch(() => {});

  useEffect(() => {
    fetchPosts();
    api.get('/clubs').then((r) => setClubs(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openCreate = () => {
    setForm(emptyForm); setEditId(null);
    setImageFile(null); setImagePreview(''); setExistingImage('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({ club_id: p.club_id, title: p.title, content: p.content || '', type: p.type });
    setEditId(p.id);
    setImageFile(null); setImagePreview('');
    setExistingImage(p.image || '');
    setShowForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeNewImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let savedId = editId;
      if (editId) {
        await api.put(`/posts/${editId}`, form);
        toast.success('Đã cập nhật');
      } else {
        const r = await api.post('/posts', form);
        savedId = r.data.id;
        toast.success('Đã tạo tin tức');
      }
      if (imageFile && savedId) {
        setUploading(true);
        const fd = new FormData();
        fd.append('image', imageFile);
        try {
          await api.post(`/posts/${savedId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {
          toast.error('Upload ảnh bìa thất bại');
        } finally { setUploading(false); }
      }
      setShowForm(false);
      fetchPosts();
    } catch (err) { toast.error(err.response?.data?.error || 'Lỗi!'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa tin tức này?')) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Đã xóa');
      fetchPosts();
    } catch { toast.error('Lỗi'); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Quản lý Tin tức</h1>
          <p className="text-slate-500 text-sm mt-1">{posts.length} tin tức</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Thêm tin tức</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Ảnh bìa', 'Tiêu đề', 'CLB', 'Loại', 'Ngày', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-14 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Image size={14} className="text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-slate-800 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{p.content?.slice(0, 50)}...</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.club_name}</td>
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${typeColors[p.type] || 'bg-slate-100 text-slate-600'}`}>
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{p.created_at?.slice(0, 10)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(p.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="font-bold text-slate-800">{editId ? 'Chỉnh sửa tin tức' : 'Thêm tin tức mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
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
                <label className="text-sm font-medium text-slate-700 block mb-1">Loại tin tức</label>
                <select value={form.type} onChange={set('type')} className="input">
                  {POST_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Nội dung</label>
                <textarea value={form.content} onChange={set('content')} className="input min-h-32 resize-none" />
              </div>

              {/* Ảnh bìa */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-sm font-medium text-slate-700 block">Ảnh bìa tin tức</label>
                {(imagePreview || existingImage) ? (
                  <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100">
                    <img src={imagePreview || existingImage} alt="" className="w-full h-full object-cover" />
                    {imagePreview && (
                      <div className="absolute bottom-2 left-2">
                        <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">Mới</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-black/60 hover:bg-indigo-600 text-white rounded-lg px-2 py-1 text-xs"
                      >
                        Thay đổi
                      </button>
                      <button
                        type="button"
                        onClick={imagePreview ? removeNewImage : () => setExistingImage('')}
                        className="bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl py-6 flex flex-col items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-all"
                  >
                    <Upload size={20} />
                    <span className="text-sm font-medium">Chọn ảnh bìa</span>
                    <span className="text-xs">PNG, JPG, WEBP · tối đa 5MB</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <button type="submit" disabled={saving || uploading} className="btn-primary w-full justify-center">
                <Save size={16} /> {saving || uploading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
