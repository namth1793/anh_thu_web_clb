const router = require('express').Router();
const db = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');

// Get or create a chat room for the current user (optionally for a specific club)
router.post('/rooms', (req, res) => {
  const { user_id, club_id, guest_name } = req.body;
  let room;
  if (user_id) {
    room = db.prepare('SELECT * FROM chat_rooms WHERE user_id = ? AND status = ?').get(user_id, 'open');
  }
  if (!room) {
    const result = db.prepare('INSERT INTO chat_rooms (user_id, club_id) VALUES (?, ?)').run(user_id || null, club_id || null);
    room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(result.lastInsertRowid);

    // Welcome message
    db.prepare(`INSERT INTO messages (room_id, sender_name, content, is_admin) VALUES (?, ?, ?, 1)`)
      .run(room.id, 'Clubhub Support', `Xin chào${guest_name ? ' ' + guest_name : ''}! 👋 Chào mừng bạn đến với hỗ trợ trực tuyến Clubhub. Chúng tôi sẽ phản hồi trong thời gian sớm nhất. Trong lúc chờ đợi, bạn có thể thử chatbot AI để được hỗ trợ nhanh hơn.`);
  }
  res.json(room);
});

// Get messages for a room
router.get('/rooms/:roomId/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE room_id = ? ORDER BY created_at ASC').all(req.params.roomId);
  res.json(messages);
});

// Get all open rooms (admin)
router.get('/rooms', auth, adminOnly, (req, res) => {
  const rooms = db.prepare(`
    SELECT cr.*, u.name as user_name, u.email as user_email,
           c.name as club_name,
           (SELECT content FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_time
    FROM chat_rooms cr
    LEFT JOIN users u ON cr.user_id = u.id
    LEFT JOIN clubs c ON cr.club_id = c.id
    ORDER BY last_message_time DESC
  `).all();
  res.json(rooms);
});

// Close a room
router.put('/rooms/:roomId/close', auth, adminOnly, (req, res) => {
  db.prepare("UPDATE chat_rooms SET status = 'closed' WHERE id = ?").run(req.params.roomId);
  res.json({ message: 'Đã đóng cuộc trò chuyện' });
});

// Get room for logged-in user
router.get('/my-room', auth, (req, res) => {
  const room = db.prepare("SELECT * FROM chat_rooms WHERE user_id = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1").get(req.user.id);
  res.json(room || null);
});

module.exports = router;
