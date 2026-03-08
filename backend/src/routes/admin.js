const router = require('express').Router();
const db = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');

// Apply auth + adminOnly to all admin routes
router.use(auth, adminOnly);

// Dashboard stats
router.get('/stats', (req, res) => {
  const stats = {
    clubs: db.prepare('SELECT COUNT(*) as c FROM clubs').get().c,
    students: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c,
    events: db.prepare('SELECT COUNT(*) as c FROM events').get().c,
    applications: db.prepare('SELECT COUNT(*) as c FROM applications').get().c,
    pendingApplications: db.prepare("SELECT COUNT(*) as c FROM applications WHERE status = 'pending'").get().c,
    posts: db.prepare('SELECT COUNT(*) as c FROM posts').get().c,
    totalMembers: db.prepare('SELECT SUM(member_count) as s FROM clubs').get().s || 0,
  };

  const topClubs = db.prepare('SELECT name, member_count, category FROM clubs ORDER BY member_count DESC LIMIT 5').all();
  const recentApps = db.prepare(`
    SELECT a.*, c.name as club_name FROM applications a
    JOIN clubs c ON a.club_id = c.id ORDER BY a.created_at DESC LIMIT 5
  `).all();
  const upcomingEvents = db.prepare(`
    SELECT e.title, e.start_time, c.name as club_name FROM events e
    JOIN clubs c ON e.club_id = c.id
    WHERE e.status = 'upcoming' ORDER BY e.start_time ASC LIMIT 5
  `).all();

  const categoryCounts = db.prepare('SELECT category, COUNT(*) as count FROM clubs GROUP BY category').all();

  res.json({ stats, topClubs, recentApps, upcomingEvents, categoryCounts });
});

// Get all users
router.get('/users', (req, res) => {
  const { role, search } = req.query;
  let sql = 'SELECT id, name, email, role, major, year, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// Update user role
router.put('/users/:id', (req, res) => {
  const { role } = req.body;
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Đã cập nhật vai trò' });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa người dùng' });
});

// Get all clubs (admin view with full info)
router.get('/clubs', (req, res) => {
  const clubs = db.prepare(`
    SELECT c.*, u.name as leader_name,
      (SELECT url FROM club_images WHERE club_id = c.id ORDER BY uploaded_at ASC LIMIT 1) as cover_image
    FROM clubs c LEFT JOIN users u ON c.leader_id = u.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(clubs);
});

// Get all events
router.get('/events', (req, res) => {
  const events = db.prepare(`
    SELECT e.*, c.name as club_name FROM events e
    JOIN clubs c ON e.club_id = c.id ORDER BY e.created_at DESC
  `).all();
  res.json(events);
});

// Get all applications
router.get('/applications', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT a.*, c.name as club_name FROM applications a JOIN clubs c ON a.club_id = c.id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  sql += ' ORDER BY a.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// Get all posts
router.get('/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, c.name as club_name, u.name as author_name
    FROM posts p
    JOIN clubs c ON p.club_id = c.id
    LEFT JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(posts);
});

// Send broadcast notification to all students
router.post('/broadcast', (req, res) => {
  const { title, content } = req.body;
  const students = db.prepare("SELECT id FROM users WHERE role IN ('student','leader')").all();
  const insert = db.prepare('INSERT INTO notifications (user_id, title, content, type) VALUES (?, ?, ?, ?)');
  students.forEach((s) => {
    insert.run(s.id, title, content, 'broadcast');
    if (global.io) global.io.notifyUser(s.id, { title, content, type: 'broadcast' });
  });
  res.json({ message: `Đã gửi thông báo đến ${students.length} sinh viên` });
});

module.exports = router;
