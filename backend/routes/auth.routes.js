const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { execute, executeInsert } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', [
  body('student_id').notEmpty().withMessage('รหัสนักศึกษาห้ามว่าง'),
  body('full_name').notEmpty().withMessage('ชื่อ-นามสกุลห้ามว่าง'),
  body('email').isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  body('classroom').notEmpty().withMessage('ห้องเรียนห้ามว่าง'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { student_id, full_name, email, password, classroom, phone } = req.body;
  try {
    const [existing] = await execute(
      'SELECT id FROM users WHERE email = ? OR student_id = ?',
      [email, student_id]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'อีเมลหรือรหัสนักศึกษานี้ถูกใช้งานแล้ว' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newId = await executeInsert(
      'INSERT INTO users (student_id, full_name, email, password, classroom, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, full_name, email, hashed, classroom, phone || null]
    );

    const token = jwt.sign(
      { id: newId, role: 'member' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      token,
      user: { id: newId, student_id, full_name, email, role: 'member', classroom }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('password').notEmpty().withMessage('รหัสผ่านห้ามว่าง'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const [rows] = await execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        classroom: user.classroom,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
