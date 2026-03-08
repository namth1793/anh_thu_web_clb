const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const sign = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// Register
router.post('/register', (req, res) => {
  const { name, email, password, major, year } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email đã được sử dụng' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, major, year)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email, hash, major || null, year || 1);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: sign(user), user: sanitize(user) });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });
  }
  res.json({ token: sign(user), user: sanitize(user) });
});

// Get current user
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });
  res.json(sanitize(user));
});

// Update profile
router.put('/me', auth, (req, res) => {
  const { name, major, year, bio } = req.body;
  db.prepare(`
    UPDATE users SET name = ?, major = ?, year = ?, bio = ? WHERE id = ?
  `).run(name, major, year, bio, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(sanitize(user));
});

// Change password
router.put('/password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Đổi mật khẩu thành công' });
});

const sanitize = (u) => {
  const { password, ...rest } = u;
  return rest;
};

module.exports = router;
