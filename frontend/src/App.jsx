import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ChatWidget from './components/chat/ChatWidget';

// Pages
import Home from './pages/Home';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import Events from './pages/Events';
import Categories from './pages/Categories';
import Suggest from './pages/Suggest';
import News from './pages/News';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClubs from './pages/admin/AdminClubs';
import AdminEvents from './pages/admin/AdminEvents';
import AdminApplications from './pages/admin/AdminApplications';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminMessages from './pages/admin/AdminMessages';

function ProtectedRoute({ children, adminOnly }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !['admin', 'leader'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes with Navbar */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <main className="min-h-screen">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/clubs" element={<Clubs />} />
                  <Route path="/clubs/:slug" element={<ClubDetail />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/suggest" element={<Suggest />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/profile"
                    element={<ProtectedRoute><Profile /></ProtectedRoute>}
                  />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />

        {/* Admin routes (no public footer) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="clubs" element={<AdminClubs />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="messages" element={<AdminMessages />} />
        </Route>
      </Routes>

      <ChatWidget />
    </>
  );
}
