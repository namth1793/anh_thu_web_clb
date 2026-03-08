const router = require('express').Router();
const db = require('../config/database');
const { auth, adminOnly, leaderOrAdmin } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'clb-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Specific routes MUST come before /:slug ─────────────────────────────────

// Get categories with counts
router.get('/meta/categories', (req, res) => {
  const cats = db.prepare(`
    SELECT category, COUNT(*) as count FROM clubs GROUP BY category
  `).all();
  res.json(cats);
});

// Get saved clubs for current user
router.get('/me/saved', auth, (req, res) => {
  const clubs = db.prepare(`
    SELECT c.* FROM saved_clubs sc
    JOIN clubs c ON sc.club_id = c.id
    WHERE sc.user_id = ?
    ORDER BY sc.saved_at DESC
  `).all(req.user.id);
  res.json(clubs);
});

// ── General routes ────────────────────────────────────────────────────────────

// Get all clubs (with search & filter)
router.get('/', (req, res) => {
  const { search = '', category = '', featured } = req.query;
  let sql = `
    SELECT c.*, u.name as leader_name, u.avatar as leader_avatar, u.major as leader_major,
      (SELECT url FROM club_images WHERE club_id = c.id ORDER BY uploaded_at ASC LIMIT 1) as cover_image
    FROM clubs c
    LEFT JOIN users u ON c.leader_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (search) {
    sql += ` AND (c.name LIKE ? OR c.short_desc LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += ` AND c.category = ?`;
    params.push(category);
  }
  if (featured === '1') {
    sql += ` AND c.is_featured = 1`;
  }
  sql += ` ORDER BY c.is_featured DESC, c.member_count DESC`;
  const clubs = db.prepare(sql).all(...params);
  res.json(clubs);
});

// Get club by slug
router.get('/:slug', (req, res) => {
  const club = db.prepare(`
    SELECT c.*, COALESCE(c.leader_name, u.name) as leader_name, u.avatar as leader_avatar, u.major as leader_major, u.bio as leader_bio, u.email as leader_email
    FROM clubs c
    LEFT JOIN users u ON c.leader_id = u.id
    WHERE c.slug = ?
  `).get(req.params.slug);
  if (!club) return res.status(404).json({ error: 'CLB không tồn tại' });

  // Get board members
  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar, u.major, cm.role, cm.joined_at
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ? ORDER BY cm.joined_at ASC
  `).all(club.id);

  // Get events
  const events = db.prepare(`
    SELECT * FROM events WHERE club_id = ? ORDER BY start_time ASC LIMIT 5
  `).all(club.id);

  // Get posts
  const posts = db.prepare(`
    SELECT p.*, u.name as author_name FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.club_id = ? ORDER BY p.created_at DESC LIMIT 5
  `).all(club.id);

  res.json({ ...club, members, events, posts });
});

// Save / unsave club
router.post('/:id/save', auth, (req, res) => {
  const existing = db.prepare('SELECT id FROM saved_clubs WHERE user_id = ? AND club_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM saved_clubs WHERE user_id = ? AND club_id = ?').run(req.user.id, req.params.id);
    res.json({ saved: false });
  } else {
    db.prepare('INSERT INTO saved_clubs (user_id, club_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    res.json({ saved: true });
  }
});

// Create club (admin)
router.post('/', auth, adminOnly, (req, res) => {
  const { name, slug, category, short_desc, description, founded_year, leader_id, leader_name, contact_email, contact_fb, leader_fb, activities, departments } = req.body;
  const result = db.prepare(`
    INSERT INTO clubs (name, slug, category, short_desc, description, founded_year, leader_id, leader_name, contact_email, contact_fb, leader_fb, activities, departments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, category, short_desc, description, founded_year, leader_id || null, leader_name || null, contact_email, contact_fb, leader_fb || null, activities || null, departments || null);
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(club);
});

// Update club (admin or leader of that club)
router.put('/:id', auth, leaderOrAdmin, (req, res) => {
  const { name, category, short_desc, description, founded_year, leader_name, contact_email, contact_fb, leader_fb, activities, departments, is_featured } = req.body;
  db.prepare(`
    UPDATE clubs SET name=?, category=?, short_desc=?, description=?, founded_year=?,
    leader_name=?, contact_email=?, contact_fb=?, leader_fb=?, activities=?, departments=?, is_featured=? WHERE id=?
  `).run(name, category, short_desc, description, founded_year, leader_name || null, contact_email, contact_fb, leader_fb || null, activities || null, departments || null, is_featured || 0, req.params.id);
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.params.id);
  res.json(club);
});

// Delete club (admin)
router.delete('/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM clubs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa CLB' });
});

// Get images for a club
router.get('/:id/images', (req, res) => {
  const images = db.prepare('SELECT * FROM club_images WHERE club_id = ? ORDER BY uploaded_at DESC').all(req.params.id);
  res.json(images);
});

// Upload images for a club (admin) — stored on Cloudinary
router.post('/:id/images', auth, adminOnly, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Không có file nào được upload' });
  const insert = db.prepare('INSERT INTO club_images (club_id, url, public_id) VALUES (?, ?, ?)');
  const inserted = req.files.map((f) => {
    const result = insert.run(req.params.id, f.path, f.filename);
    return { id: result.lastInsertRowid, club_id: req.params.id, url: f.path, public_id: f.filename };
  });
  res.status(201).json(inserted);
});

// Delete a club image (admin) — also removes from Cloudinary
router.delete('/images/:imageId', auth, adminOnly, async (req, res) => {
  const img = db.prepare('SELECT * FROM club_images WHERE id = ?').get(req.params.imageId);
  if (!img) return res.status(404).json({ error: 'Ảnh không tồn tại' });
  try { await cloudinary.uploader.destroy(img.public_id); } catch {}
  db.prepare('DELETE FROM club_images WHERE id = ?').run(req.params.imageId);
  res.json({ message: 'Đã xóa ảnh' });
});

module.exports = router;
