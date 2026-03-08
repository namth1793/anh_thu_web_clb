const router = require('express').Router();
const db = require('../config/database');
const { auth, adminOnly, leaderOrAdmin } = require('../middleware/auth');

// Submit application (public or logged-in)
router.post('/', (req, res) => {
  const { club_id, name, email, major, year, reason } = req.body;
  if (!club_id || !name || !email) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  // Get user_id from email if exists
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  const user_id = user?.id || null;

  // Check duplicate
  const dup = db.prepare('SELECT id FROM applications WHERE club_id = ? AND email = ? AND status != ?').get(club_id, email, 'rejected');
  if (dup) return res.status(400).json({ error: 'Bạn đã nộp đơn cho CLB này rồi' });

  const result = db.prepare(`
    INSERT INTO applications (club_id, user_id, name, email, major, year, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(club_id, user_id, name, email, major, year, reason);

  const club = db.prepare('SELECT name from clubs WHERE id = ?').get(club_id);

  // Notify admin
  if (global.io) {
    global.io.emit('new_application', { clubName: club?.name, applicantName: name });
  }

  res.status(201).json({ message: 'Đã nộp đơn thành công! Chúng tôi sẽ liên hệ sớm nhất.' });
});

// Get my applications
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id);
  const apps = db.prepare(`
    SELECT a.*, c.name as club_name, c.logo as club_logo, c.slug as club_slug
    FROM applications a
    JOIN clubs c ON a.club_id = c.id
    WHERE a.email = ?
    ORDER BY a.created_at DESC
  `).all(user.email);
  res.json(apps);
});

// Get applications for a club (leader/admin)
router.get('/club/:clubId', auth, leaderOrAdmin, (req, res) => {
  const apps = db.prepare(`
    SELECT a.*, c.name as club_name
    FROM applications a
    JOIN clubs c ON a.club_id = c.id
    WHERE a.club_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.clubId);
  res.json(apps);
});

// Get all applications (admin)
router.get('/', auth, adminOnly, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT a.*, c.name as club_name, c.slug as club_slug
    FROM applications a
    JOIN clubs c ON a.club_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  sql += ' ORDER BY a.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// Update application status (approve/reject)
router.put('/:id', auth, leaderOrAdmin, (req, res) => {
  const { status } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Không tìm thấy đơn' });

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);

  // Notify user
  if (app.user_id) {
    const club = db.prepare('SELECT name FROM clubs WHERE id = ?').get(app.club_id);
    const notifMsg = status === 'approved'
      ? `Chúc mừng! Đơn đăng ký tham gia ${club?.name} của bạn đã được chấp nhận.`
      : `Rất tiếc, đơn đăng ký tham gia ${club?.name} của bạn chưa được chấp nhận lần này.`;

    db.prepare(`
      INSERT INTO notifications (user_id, title, content, type, ref_id)
      VALUES (?, ?, ?, 'application', ?)
    `).run(app.user_id, status === 'approved' ? '✅ Đơn đăng ký được duyệt!' : '❌ Kết quả đơn đăng ký', notifMsg, app.club_id);

    if (global.io) {
      global.io.notifyUser(app.user_id, {
        title: status === 'approved' ? '✅ Đơn đăng ký được duyệt!' : '❌ Kết quả đơn đăng ký',
        content: notifMsg,
        type: 'application',
      });
    }

    // Add to club_members if approved
    if (status === 'approved') {
      db.prepare('INSERT OR IGNORE INTO club_members (club_id, user_id) VALUES (?, ?)').run(app.club_id, app.user_id);
      db.prepare('UPDATE clubs SET member_count = member_count + 1 WHERE id = ?').run(app.club_id);
    }
  }

  res.json({ message: `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} đơn` });
});

module.exports = router;
