const router = require('express').Router();
const db = require('../config/database');
const { auth, leaderOrAdmin, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'clb-posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 675, crop: 'limit', quality: 'auto' }],
  },
});
const uploadPost = multer({ storage: postStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get all posts
router.get('/', (req, res) => {
  const { club_id, type, search, limit = 20 } = req.query;
  let sql = `
    SELECT p.*, c.name as club_name, c.slug as club_slug, c.logo as club_logo,
           u.name as author_name
    FROM posts p
    JOIN clubs c ON p.club_id = c.id
    LEFT JOIN users u ON p.author_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (club_id) { sql += ' AND p.club_id = ?'; params.push(club_id); }
  if (type) { sql += ' AND p.type = ?'; params.push(type); }
  if (search) { sql += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ` ORDER BY p.created_at DESC LIMIT ${parseInt(limit)}`;
  res.json(db.prepare(sql).all(...params));
});

// Get single post
router.get('/:id', (req, res) => {
  const post = db.prepare(`
    SELECT p.*, c.name as club_name, c.slug as club_slug, u.name as author_name
    FROM posts p
    JOIN clubs c ON p.club_id = c.id
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Bài viết không tồn tại' });
  res.json(post);
});

// Upload post cover image
router.post('/:id/image', auth, leaderOrAdmin, uploadPost.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file ảnh' });
  const url = req.file.path;
  db.prepare('UPDATE posts SET image = ? WHERE id = ?').run(url, req.params.id);
  res.json({ url });
});

// Create post
router.post('/', auth, leaderOrAdmin, (req, res) => {
  const { club_id, title, content, image, type } = req.body;
  const result = db.prepare(`
    INSERT INTO posts (club_id, author_id, title, content, image, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(club_id, req.user.id, title, content, image || null, type || 'news');
  res.status(201).json(db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid));
});

// Update post
router.put('/:id', auth, leaderOrAdmin, (req, res) => {
  const { title, content, image, type } = req.body;
  db.prepare('UPDATE posts SET title=?, content=?, image=?, type=? WHERE id=?')
    .run(title, content, image || null, type, req.params.id);
  res.json(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id));
});

// Delete post
router.delete('/:id', auth, leaderOrAdmin, (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa bài viết' });
});

module.exports = router;
