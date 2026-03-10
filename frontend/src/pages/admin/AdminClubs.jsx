import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, PlusCircle, MinusCircle, Upload, ImageIcon } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', slug: '', category: 'technology', short_desc: '',
  description: '', contact_fb: '', leader_name: '', leader_fb: '',
  activities: '', founded_year: new Date().getFullYear(),
  contact_email: '', is_featured: 0, member_count: 0,
};
const emptyDept = { name: '', desc: '' };

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [depts, setDepts] = useState([{ ...emptyDept }]);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Image states
  const [clubImages, setClubImages] = useState([]);  // {id, url, public_id} from server
  const [newFiles, setNewFiles] = useState([]);       // File[] pending upload
  const [previews, setPreviews] = useState([]);       // blob URLs for preview
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchClubs = () => api.get('/admin/clubs').then((r) => setClubs(r.data)).catch(() => {});
  useEffect(() => { fetchClubs(); }, []);

  // Cleanup blob preview URLs
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const fetchImages = (id) =>
    api.get(`/clubs/${id}/images`).then((r) => setClubImages(r.data)).catch(() => setClubImages([]));

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [k]: val, ...(k === 'name' && !editId ? { slug: toSlug(val) } : {}) }));
  };

  const openCreate = () => {
    setForm(emptyForm); setDepts([{ ...emptyDept }]); setEditId(null);
    setClubImages([]); setNewFiles([]); setPreviews([]);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      name: c.name, slug: c.slug, category: c.category, short_desc: c.short_desc || '',
      description: c.description || '', contact_fb: c.contact_fb || '',
      leader_name: c.leader_name || '', leader_fb: c.leader_fb || '',
      activities: c.activities || '', founded_year: c.founded_year || '',
      contact_email: c.contact_email || '', is_featured: c.is_featured, member_count: c.member_count || 0,
    });
    let parsed = [{ ...emptyDept }];
    try { if (c.departments) parsed = JSON.parse(c.departments); } catch {}
    setDepts(parsed.length ? parsed : [{ ...emptyDept }]);
    setEditId(c.id);
    setNewFiles([]); setPreviews([]);
    fetchImages(c.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, departments: JSON.stringify(depts.filter((d) => d.name.trim())) };
    try {
      let savedId = editId;
      if (editId) {
        await api.put(`/clubs/${editId}`, payload);
        toast.success('Đã cập nhật CLB');
      } else {
        const r = await api.post('/clubs', payload);
        savedId = r.data.id;
        toast.success('Đã tạo CLB mới');
      }
      if (newFiles.length > 0 && savedId) {
        await doUpload(savedId);
      }
      setShowForm(false);
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi!');
    } finally { setSaving(false); }
  };

  const doUpload = async (id) => {
    setUploading(true);
    const fd = new FormData();
    newFiles.forEach((f) => fd.append('images', f));
    try {
      const r = await api.post(`/clubs/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewFiles([]); setPreviews([]);
      setClubImages((prev) => [...r.data, ...prev]);
      toast.success(`Đã upload ${r.data.length} ảnh`);
    } catch {
      toast.error('Upload ảnh thất bại');
    } finally { setUploading(false); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (clubImages.length + newFiles.length + files.length > 10) {
      toast.error('Tối đa 10 ảnh mỗi CLB');
      return;
    }
    setNewFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewFile = (i) => {
    URL.revokeObjectURL(previews[i]);
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const deleteExistingImage = async (imgId) => {
    try {
      await api.delete(`/clubs/images/${imgId}`);
      setClubImages((prev) => prev.filter((img) => img.id !== imgId));
      toast.success('Đã xóa ảnh');
    } catch { toast.error('Không thể xóa ảnh'); }
  };

  const updateDept = (i, k, v) => setDepts((prev) => prev.map((d, idx) => idx === i ? { ...d, [k]: v } : d));
  const addDept = () => setDepts((prev) => [...prev, { ...emptyDept }]);
  const removeDept = (i) => setDepts((prev) => prev.filter((_, idx) => idx !== i));

  const remove = async (id, name) => {
    if (!window.confirm(`Xóa CLB "${name}"? Hành động này không thể hoàn tác!`)) return;
    try {
      await api.delete(`/clubs/${id}`);
      toast.success('Đã xóa CLB');
      fetchClubs();
    } catch { toast.error('Không thể xóa'); }
  };

  const totalImages = clubImages.length + newFiles.length;

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
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="font-bold text-slate-800 text-lg">{editId ? 'Chỉnh sửa CLB' : 'Thêm CLB mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
            </div>

            <form onSubmit={save} className="p-6 space-y-6">

              {/* Tên CLB */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-700 block mb-1">Tên CLB *</label>
                  <input value={form.name} onChange={set('name')} className="input" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Số thành viên</label>
                  <input type="number" min="0" value={form.member_count} onChange={set('member_count')} className="input" placeholder="0" />
                </div>
              </div>

              {/* Danh mục + Mô tả ngắn */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Danh mục *</label>
                  <select value={form.category} onChange={set('category')} className="input" required>
                    <option value="technology">Công nghệ</option>
                    <option value="academic">Học thuật</option>
                    <option value="media">Truyền thông</option>
                    <option value="art">Nghệ thuật</option>
                    <option value="sports">Thể thao</option>
                    <option value="community">Cộng đồng</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Mô tả ngắn</label>
                  <input value={form.short_desc} onChange={set('short_desc')} className="input" placeholder="Mô tả ngắn gọn..." />
                </div>
              </div>

              {/* Leader */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Leader</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Tên Leader</label>
                  <input value={form.leader_name} onChange={set('leader_name')} className="input" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Link Facebook của Leader</label>
                  <input value={form.leader_fb} onChange={set('leader_fb')} className="input" placeholder="https://www.facebook.com/..." />
                </div>
              </div>

              {/* Thông tin CLB */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thông tin CLB</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Fanpage Facebook của CLB</label>
                  <input value={form.contact_fb} onChange={set('contact_fb')} className="input" placeholder="https://www.facebook.com/..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Email liên hệ</label>
                  <input type="email" value={form.contact_email} onChange={set('contact_email')} className="input" placeholder="clb@gmail.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Giới thiệu CLB</label>
                  <textarea value={form.description} onChange={set('description')} className="input min-h-28 resize-none" placeholder="Mô tả đầy đủ về CLB..." />
                </div>
              </div>

              {/* Hoạt động */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Các hoạt động</p>
                <textarea value={form.activities} onChange={set('activities')} className="input min-h-28 resize-none"
                  placeholder="Mô tả các hoạt động chính (xuống dòng để tách từng hoạt động)..." />
              </div>

              {/* Các ban */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Các ban</p>
                  <button type="button" onClick={addDept} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    <PlusCircle size={15} /> Thêm ban
                  </button>
                </div>
                <div className="space-y-3">
                  {depts.map((d, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <input value={d.name} onChange={(e) => updateDept(i, 'name', e.target.value)}
                          className="input text-sm py-1.5" placeholder="Tên ban (VD: Ban Truyền thông)" />
                        {depts.length > 1 && (
                          <button type="button" onClick={() => removeDept(i)} className="text-red-400 hover:text-red-600 shrink-0">
                            <MinusCircle size={16} />
                          </button>
                        )}
                      </div>
                      <textarea value={d.desc} onChange={(e) => updateDept(i, 'desc', e.target.value)}
                        className="input text-sm py-1.5 min-h-16 resize-none" placeholder="Mô tả nhiệm vụ của ban..." />
                    </div>
                  ))}
                </div>
              </div>

              {/* Hình ảnh CLB */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hình ảnh CLB</p>
                  <span className="text-xs text-slate-400">{totalImages}/10 ảnh</span>
                </div>

                {/* Image grid */}
                {(clubImages.length > 0 || previews.length > 0) && (
                  <div className="grid grid-cols-3 gap-2">
                    {/* Existing images from Cloudinary */}
                    {clubImages.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => deleteExistingImage(img.id)}
                          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}

                    {/* New files preview */}
                    {previews.map((url, i) => (
                      <div key={`new-${i}`} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute bottom-1.5 left-1.5">
                          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">Mới</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {totalImages === 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                    <ImageIcon size={16} /> Chưa có ảnh nào
                  </div>
                )}

                {/* Upload zone */}
                {totalImages < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl py-5 flex flex-col items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-all"
                  >
                    <Upload size={20} />
                    <span className="text-sm font-medium">Chọn ảnh để upload</span>
                    <span className="text-xs">PNG, JPG, WEBP · tối đa 5MB mỗi ảnh</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <button type="submit" disabled={saving || uploading} className="btn-primary w-full justify-center">
                <Save size={16} />
                {saving || uploading ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}