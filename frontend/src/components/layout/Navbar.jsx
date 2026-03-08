import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/clubs', label: 'CLB' },
  { to: '/categories', label: 'Danh mục' },
  { to: '/events', label: 'Sự kiện' },
  { to: '/news', label: 'Tin tức' },
  { to: '/suggest', label: '✨ Gợi ý' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount, clearUnread } = useSocket();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setUserMenu(false); }, [location]);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
      clearUnread();
      await api.put('/notifications/read-all');
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-100' : 'bg-white border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-black shadow-md group-hover:shadow-indigo-200 group-hover:scale-105 transition-all duration-200">C</div>
            <span className="gradient-text text-xl">Clubhub</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((l) => {
              const isActive = location.pathname === l.to || (l.to !== '/' && location.pathname.startsWith(l.to));
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'}`}
                >
                  {l.label}
                  {isActive && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifs(); setUserMenu(false); }}
                    className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">Thông báo</div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-sm">Chưa có thông báo</div>
                        ) : notifs.map((n) => (
                          <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-indigo-50/50' : ''}`}>
                            <p className="text-sm font-medium text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => { setUserMenu(!userMenu); setNotifOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-24 truncate">{user.name}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-semibold text-sm text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                        <User size={15} /> Hồ sơ của tôi
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-sm text-indigo-600 transition-colors">
                          <LayoutDashboard size={15} /> Admin Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-500 transition-colors">
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Đăng nhập</Link>
                <Link to="/register" className="btn-primary text-sm">Đăng ký</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-slate-100">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-2 flex gap-2 px-2">
                <Link to="/login" className="btn-secondary flex-1 justify-center text-sm">Đăng nhập</Link>
                <Link to="/register" className="btn-primary flex-1 justify-center text-sm">Đăng ký</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close dropdowns when clicking outside */}
      {(userMenu || notifOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setUserMenu(false); setNotifOpen(false); }} />
      )}
    </nav>
  );
}
