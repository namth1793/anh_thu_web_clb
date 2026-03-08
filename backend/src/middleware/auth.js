const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Không có token xác thực' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ admin mới có quyền thực hiện hành động này' });
  }
  next();
};

const leaderOrAdmin = (req, res, next) => {
  if (!['admin', 'leader'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này' });
  }
  next();
};

module.exports = { auth, adminOnly, leaderOrAdmin };
