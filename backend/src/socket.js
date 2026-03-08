const db = require('./config/database');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Online admin sockets
  const adminSockets = new Map();
  const userSockets = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        socket.user = null;
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (user) {
      userSockets.set(user.id, socket.id);
      if (user.role === 'admin' || user.role === 'leader') {
        adminSockets.set(user.id, socket.id);
      }
      socket.join(`user_${user.id}`);
    }

    // Join a chat room
    socket.on('join_room', ({ roomId }) => {
      socket.join(`room_${roomId}`);
    });

    // Send message
    socket.on('send_message', ({ roomId, content, senderName }) => {
      const senderId = user?.id || null;
      const isAdmin = user?.role === 'admin' || user?.role === 'leader' ? 1 : 0;
      const name = senderName || user?.name || 'Khách';

      const result = db.prepare(`
        INSERT INTO messages (room_id, sender_id, sender_name, content, is_admin)
        VALUES (?, ?, ?, ?, ?)
      `).run(roomId, senderId, name, content, isAdmin);

      const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

      // Broadcast to room
      io.to(`room_${roomId}`).emit('new_message', msg);

      // Notify admins if message from student
      if (!isAdmin) {
        adminSockets.forEach((socketId) => {
          io.to(socketId).emit('room_activity', { roomId, message: msg });
        });
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, name }) => {
      socket.to(`room_${roomId}`).emit('user_typing', { name });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(`room_${roomId}`).emit('user_stop_typing');
    });

    // Admin joins all open rooms
    socket.on('admin_join_all', () => {
      if (user?.role === 'admin' || user?.role === 'leader') {
        const rooms = db.prepare("SELECT id FROM chat_rooms WHERE status = 'open'").all();
        rooms.forEach((r) => socket.join(`room_${r.id}`));
      }
    });

    // Send notification to a user
    socket.on('send_notification', ({ targetUserId, notification }) => {
      if (user?.role === 'admin' || user?.role === 'leader') {
        io.to(`user_${targetUserId}`).emit('notification', notification);
      }
    });

    socket.on('disconnect', () => {
      if (user) {
        userSockets.delete(user.id);
        adminSockets.delete(user.id);
      }
    });
  });

  // Export helper to emit notifications from routes
  io.notifyUser = (userId, notification) => {
    io.to(`user_${userId}`).emit('notification', notification);
  };

  global.io = io;
};
