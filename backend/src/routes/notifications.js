const router = require('express').Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// Get my notifications
router.get('/', auth, (req, res) => {
  const notifs = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json(notifs);
});

// Get unread count
router.get('/unread-count', auth, (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
  res.json({ count });
});

// Mark one as read
router.put('/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Đã đánh dấu đã đọc' });
});

// Mark all as read
router.put('/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
});

module.exports = router;
