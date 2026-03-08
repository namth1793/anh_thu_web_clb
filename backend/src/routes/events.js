const router = require('express').Router();
const db = require('../config/database');
const { auth, adminOnly, leaderOrAdmin } = require('../middleware/auth');

// Get user's registered events (must be before /:id)
router.get('/me/registered', auth, (req, res) => {
  const events = db.prepare(`
    SELECT e.*, c.name as club_name, c.slug as club_slug
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id
    JOIN clubs c ON e.club_id = c.id
    WHERE er.user_id = ?
    ORDER BY e.start_time ASC
  `).all(req.user.id);
  res.json(events);
});

// Get all events
router.get('/', (req, res) => {
  const { club_id, status, search } = req.query;
  let sql = `
    SELECT e.*, c.name as club_name, c.slug as club_slug, c.logo as club_logo
    FROM events e
    JOIN clubs c ON e.club_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (club_id) { sql += ' AND e.club_id = ?'; params.push(club_id); }
  if (status) { sql += ' AND e.status = ?'; params.push(status); }
  if (search) { sql += ' AND (e.title LIKE ? OR e.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY e.start_time ASC';
  res.json(db.prepare(sql).all(...params));
});

// Get upcoming events
router.get('/upcoming', (req, res) => {
  const events = db.prepare(`
    SELECT e.*, c.name as club_name, c.slug as club_slug, c.logo as club_logo
    FROM events e
    JOIN clubs c ON e.club_id = c.id
    WHERE e.status = 'upcoming'
    ORDER BY e.start_time ASC LIMIT 6
  `).all();
  res.json(events);
});

// Get event by id
router.get('/:id', (req, res) => {
  const event = db.prepare(`
    SELECT e.*, c.name as club_name, c.slug as club_slug
    FROM events e JOIN clubs c ON e.club_id = c.id WHERE e.id = ?
  `).get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Sự kiện không tồn tại' });

  const regs = db.prepare('SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?').get(req.params.id);
  res.json({ ...event, registrations: regs.count });
});

// Register for event
router.post('/:id/register', auth, (req, res) => {
  try {
    db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
    res.json({ message: 'Đăng ký tham gia sự kiện thành công!' });
  } catch {
    res.status(400).json({ error: 'Bạn đã đăng ký sự kiện này rồi' });
  }
});

// Unregister
router.delete('/:id/register', auth, (req, res) => {
  db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Đã huỷ đăng ký' });
});

// Check registration status
router.get('/:id/register-status', auth, (req, res) => {
  const reg = db.prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  res.json({ registered: !!reg });
});

// Create event
router.post('/', auth, leaderOrAdmin, (req, res) => {
  const { club_id, title, description, start_time, end_time, location, status } = req.body;
  const result = db.prepare(`
    INSERT INTO events (club_id, title, description, start_time, end_time, location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(club_id, title, description, start_time, end_time, location, status || 'upcoming');
  res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid));
});

// Update event
router.put('/:id', auth, leaderOrAdmin, (req, res) => {
  const { title, description, start_time, end_time, location, status } = req.body;
  db.prepare(`
    UPDATE events SET title=?, description=?, start_time=?, end_time=?, location=?, status=? WHERE id=?
  `).run(title, description, start_time, end_time, location, status, req.params.id);
  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

// Delete event
router.delete('/:id', auth, leaderOrAdmin, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa sự kiện' });
});

module.exports = router;
