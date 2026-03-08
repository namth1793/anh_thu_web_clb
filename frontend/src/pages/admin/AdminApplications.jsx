import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const statusFilters = [
  { id: '', label: 'Tất cả' },
  { id: 'pending', label: '⏳ Chờ duyệt' },
  { id: 'approved', label: '✅ Đã duyệt' },
  { id: 'rejected', label: '❌ Từ chối' },
];

const statusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/applications${status ? `?status=${status}` : ''}`);
      setApps(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, [status]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/applications/${id}`, { status: newStatus });
      toast.success(newStatus === 'approved' ? '✅ Đã duyệt đơn' : '❌ Đã từ chối đơn');
      fetchApps();
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Quản lý Đơn đăng ký</h1>
        <p className="text-slate-500 text-sm mt-1">{apps.length} đơn</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {statusFilters.map((f) => (
          <button key={f.id} onClick={() => setStatus(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === f.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-slate-200" />)}</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Clock size={40} className="mx-auto mb-3 opacity-40" />
          <p>Không có đơn nào</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Người đăng ký', 'CLB', 'Email', 'Ngành', 'Năm', 'Ngày', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{a.name}</td>
                    <td className="py-3 px-4 text-slate-600">{a.club_name}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{a.email}</td>
                    <td className="py-3 px-4 text-slate-500">{a.major || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{a.year ? `N${a.year}` : '—'}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{a.created_at?.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${statusColors[a.status]}`}>
                        {a.status === 'approved' ? 'Đã duyệt' : a.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {a.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(a.id, 'approved')} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="Duyệt">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => updateStatus(a.id, 'rejected')} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Từ chối">
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reason expandable - show on hover */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">Click vào dòng để xem lý do đăng ký</p>
          </div>
        </div>
      )}
    </div>
  );
}
