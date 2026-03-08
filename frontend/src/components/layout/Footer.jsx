import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-bold text-lg text-white">Clubhub</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Nền tảng kết nối và quản lý các câu lạc bộ sinh viên tại FPT University Đà Nẵng.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Facebook size={16} />
            </a>
            <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-red-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Youtube size={16} />
            </a>
            <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-pink-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Instagram size={16} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold text-white mb-4">Khám phá</h4>
          <ul className="space-y-2.5 text-sm">
            {[['/', 'Trang chủ'], ['/clubs', 'Tất cả CLB'], ['/categories', 'Danh mục'], ['/events', 'Sự kiện'], ['/news', 'Tin tức']].map(([to, label]) => (
              <li key={to}><Link to={to} className="hover:text-indigo-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Tài khoản</h4>
          <ul className="space-y-2.5 text-sm">
            {[['/login', 'Đăng nhập'], ['/register', 'Đăng ký'], ['/profile', 'Hồ sơ'], ['/suggest', 'Gợi ý CLB phù hợp']].map(([to, label]) => (
              <li key={to}><Link to={to} className="hover:text-indigo-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-white mb-4">Liên hệ</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="text-indigo-400 mt-0.5 shrink-0" />
              <span>Lô E2a-7, Đường D1, KCN Công nghệ cao, Quận Ngũ Hành Sơn, Đà Nẵng</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="text-indigo-400 shrink-0" />
              <a href="mailto:clb@fpt.edu.vn" className="hover:text-indigo-400 transition-colors">clb@fpt.edu.vn</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="text-indigo-400 shrink-0" />
              <span>(0236) 730 8686</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© 2024 Clubhub – FPT University Đà Nẵng. All rights reserved.</span>
          <span>Made with ❤️ by sinh viên FPT Đà Nẵng</span>
        </div>
      </div>
    </footer>
  );
}
