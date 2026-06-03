const express = require('express');
const router = express.Router();
const { execute } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const bcrypt = require('bcryptjs');

// GET /api/users — admin list all
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { search, role } = req.query;
    let where = [];
    let params = [];
    if (search) {
      where.push('(full_name LIKE ? OR email LIKE ? OR student_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) { where.push('role = ?'); params.push(role); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await execute(
      `SELECT id, student_id, full_name, email, role, classroom, phone, avatar, is_active, created_at
       FROM users ${whereClause} ORDER BY created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT id, student_id, full_name, email, role, classroom, phone, avatar, created_at FROM users WHERE id = ?',
      [parseInt(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/users/:id — update profile
router.put('/:id', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (req.user.id !== targetId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { full_name, classroom, phone, new_password } = req.body;
    const [rows] = await execute('SELECT * FROM users WHERE id = ?', [targetId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    const user = rows[0];
    let avatar = user.avatar;
    if (req.file) avatar = `/uploads/avatars/${req.file.filename}`;

    let password = user.password;
    if (new_password && new_password.length >= 6) {
      password = await bcrypt.hash(new_password, 10);
    }

    await execute(
      'UPDATE users SET full_name=?, classroom=?, phone=?, avatar=?, password=? WHERE id=?',
      [full_name||user.full_name, classroom||user.classroom, phone||user.phone, avatar, password, targetId]
    );
    res.json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/users/:id/role — admin change role
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'committee', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role ไม่ถูกต้อง' });
    }
    await execute('UPDATE users SET role=? WHERE id=?', [role, parseInt(req.params.id)]);
    res.json({ success: true, message: 'เปลี่ยนสิทธิ์สำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/users/:id — soft delete (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบบัญชีตัวเองได้' });
    }
    await execute('UPDATE users SET is_active = FALSE WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true, message: 'ปิดใช้งานบัญชีสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
