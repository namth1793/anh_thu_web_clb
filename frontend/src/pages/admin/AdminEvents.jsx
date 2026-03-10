import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, Upload, Eye } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { club_id: '', title: '', description: '', start_time: '', end_time: '', location: '', status: 'upcoming' };

const STATUS_LABELS = { upcoming: 'Sắp diễn ra', ongoing: 'Đang diễn ra', past: 'Đã kết thúc' };
const STATUS_COLORS = {
  upcoming: 'bg-green-100 text-green-700',
  ongoing: 'bg-blue-100 text-blue-700',
  past: 'bg-slate-100 text-slate-500',
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [detailEvent, setDetailEvent] = useState(null);

  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchEvents = () => api.get('/admin/events').then((r) => setEvents(r.data)).catch(() => {});

  useEffect(() => {
    fetchEvents();
    api.get('/clubs').then((r) => setClubs(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openCreate = () => {
    setForm(emptyForm); setEditId(null);
    setImageFile(null); setImagePreview(''); setExistingImage('');
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setForm({
      club_id: ev.club_id, title: ev.title, description: ev.description || '',
      start_time: ev.start_time?.replace(' ', 'T') || '',
      end_time: ev.end_time?.replace(' ', 'T') || '',
      location: ev.location || '', status: ev.status,
    });
    setEditId(ev.id);
    setImageFile(null); setImagePreview('');
    setExistingImage(ev.image || '');
    setShowForm(true);
  };

  const openDetail = async (ev) => {
    try {
      const r = await api.get(`/events/${ev.id}`);
      setDetailEvent(r.data);
    } catch {
      setDetailEvent(ev);
    }
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
    const payload = { ...form, start_time: form.start_time.replace('T', ' '), end_time: form.end_time.replace('T', ' ') };
    try {
      let savedId = editId;
      if (editId) {
        await api.put(`/events/${editId}`, payload);
        toast.success('Đã cập nhật');
      } else {
        const r = await api.post('/events', payload);
        savedId = r.data.id;
        toast.success('Đã tạo sự kiện');
      }
      if (imageFile && savedId) {
        setUploading(true);
        const fd = new FormData();
        fd.append('image', imageFile);
        try {
          await api.post(`/events/${savedId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {
          toast.error('Upload ảnh thất bại');
        } finally { setUploading(false); }
      }
      setShowForm(false);
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.error || 'Lỗi!'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa sự kiện này?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Đã xóa');
      fetchEvents();
    } catch { toast.error('Không thể xóa'); }
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
                    <button onClick={() => openDetail(ev)} className="text-left group">
                      <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{ev.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-64">{ev.location}</p>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{ev.club_name}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{ev.start_time?.slice(0, 16)}</td>
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${STATUS_COLORS[ev.status]}`}>
                      {STATUS_LABELS[ev.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openDetail(ev)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"><Eye size={14} /></button>
                      <button onClick={() => openEdit(ev)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(ev.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailEvent(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="font-bold text-slate-800">Chi tiết sự kiện</h2>
              <button onClick={() => setDetailEvent(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {detailEvent.image && (
                <img src={detailEvent.image} alt={detailEvent.title} className="w-full h-52 object-cover rounded-2xl" />
              )}
              <div>
                <h3 className="text-xl font-bold text-slate-800">{detailEvent.title}</h3>
                <p className="text-sm text-indigo-600 font-medium mt-1">{detailEvent.club_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Bắt đầu</p>
                  <p className="font-medium text-slate-700">{detailEvent.start_time?.slice(0, 16) || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Kết thúc</p>
                  <p className="font-medium text-slate-700">{detailEvent.end_time?.slice(0, 16) || '—'}</p>
                </div>
              </div>
              {detailEvent.location && (
                <div className="bg-slate-50 rounded-xl p-3 text-sm">
                  <p className="text-xs text-slate-400 mb-1">Địa điểm</p>
                  <p className="font-medium text-slate-700">{detailEvent.location}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className={`badge text-xs ${STATUS_COLORS[detailEvent.status]}`}>{STATUS_LABELS[detailEvent.status]}</span>
                {detailEvent.registrations !== undefined && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{detailEvent.registrations} người đăng ký</span>
                )}
              </div>
              {detailEvent.description && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mô tả</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{detailEvent.description}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setDetailEvent(null); openEdit(detailEvent); }}
                  className="btn-primary text-sm flex-1 justify-center"
                >
                  <Pencil size={14} /> Chỉnh sửa
                </button>
                <button
                  onClick={() => setDetailEvent(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="font-bold text-slate-800">{editId ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}</h2>
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

              {/* Ảnh sự kiện */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-sm font-medium text-slate-700 block">Ảnh sự kiện</label>
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
                    <span className="text-sm font-medium">Chọn ảnh sự kiện</span>
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
