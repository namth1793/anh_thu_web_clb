require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Uploads directory (configurable for Railway Volume)
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Init DB (creates tables + seeds if not exist)
require('./src/config/database');

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/clubs', require('./src/routes/clubs'));
app.use('/api/events', require('./src/routes/events'));
app.use('/api/applications', require('./src/routes/applications'));
app.use('/api/posts', require('./src/routes/posts'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/admin', require('./src/routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Public stats (no auth required) — used by Home page for all users
app.get('/api/public/stats', (req, res) => {
  const db = require('./src/config/database');
  const stats = {
    clubs: db.prepare('SELECT COUNT(*) as c FROM clubs').get().c,
    totalMembers: db.prepare('SELECT SUM(member_count) as s FROM clubs').get().s || 0,
    events: db.prepare('SELECT COUNT(*) as c FROM events').get().c,
  };
  res.json({ stats });
});

// Socket.io
require('./src/socket')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: ${process.env.DB_PATH || './data/clb.db'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});
