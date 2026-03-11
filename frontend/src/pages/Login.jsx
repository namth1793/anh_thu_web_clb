import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      navigate(user?.role === 'admin' || user?.role === 'leader' ? '/admin' : '/');
    } catch {}
  };

  const quickLogin = (email, password) => setForm({ email, password });

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-800">Đăng nhập</h1>
          <p className="text-slate-500 text-sm mt-1">Clubhub – FPT University Đà Nẵng</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="email@fpt.edu.vn"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-11"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>          
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
