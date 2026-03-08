import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', major: '', year: 1 });
  const [showPw, setShowPw] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await register(form); navigate('/'); } catch {}
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-800">Tạo tài khoản</h1>
          <p className="text-slate-500 text-sm mt-1">Tham gia cộng đồng Clubhub ngay hôm nay</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Họ và tên *</label>
              <input value={form.name} onChange={set('name')} className="input" placeholder="Nguyễn Văn A" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email sinh viên *</label>
              <input type="email" value={form.email} onChange={set('email')} className="input" placeholder="ten.xx@fpt.edu.vn" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Mật khẩu *</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="input pr-11"
                  placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Ngành học</label>
                <input value={form.major} onChange={set('major')} className="input" placeholder="VD: CNTT" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Năm học</label>
                <select value={form.year} onChange={set('year')} className="input">
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Năm {y}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
