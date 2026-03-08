import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clb_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('clb_token');
    if (token && !user) {
      api.get('/auth/me').then((r) => setUser(r.data)).catch(() => logout());
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('clb_token', data.token);
      localStorage.setItem('clb_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Chào mừng, ${data.user.name}! 🎉`);
      return data.user;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('clb_token', data.token);
      localStorage.setItem('clb_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Đăng ký thành công! Chào mừng bạn đến với Clubhub 🎉');
      return data.user;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng ký thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('clb_token');
    localStorage.removeItem('clb_user');
    setUser(null);
    toast.success('Đã đăng xuất');
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    localStorage.setItem('clb_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin: user?.role === 'admin', isLeader: user?.role === 'leader' || user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
