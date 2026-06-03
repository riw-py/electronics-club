const jwt = require('jsonwebtoken');
const { execute } = require('../config/database');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    const [rows] = await execute(
      'SELECT id, student_id, full_name, email, role, classroom, avatar FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'ผู้ใช้งานไม่พบในระบบ' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้' });
    }
    next();
  };
};

// Optional auth (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const [rows] = await execute(
        'SELECT id, student_id, full_name, email, role, classroom, avatar FROM users WHERE id = ? AND is_active = TRUE',
        [decoded.id]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) { /* ignore */ }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
