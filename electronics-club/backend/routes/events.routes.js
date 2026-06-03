const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/events — all events with optional month/type filter
router.get('/', async (req, res) => {
  try {
    const { month, year, type } = req.query;
    let where = [];
    let params = [];

    if (month && year) {
      where.push('MONTH(start_datetime) = ? AND YEAR(start_datetime) = ?');
      params.push(parseInt(month), parseInt(year));
    }
    if (type) {
      where.push('e.type = ?');
      params.push(type);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.execute(
      `SELECT e.*, u.full_name as creator_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       ${whereClause}
       ORDER BY e.start_datetime ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/events/upcoming — next 5 upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, u.full_name as creator_name
       FROM events e JOIN users u ON e.created_by = u.id
       WHERE e.start_datetime >= NOW()
       ORDER BY e.start_datetime ASC LIMIT 5`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, u.full_name as creator_name FROM events e
       JOIN users u ON e.created_by = u.id WHERE e.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/events
router.post('/', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const { title, description, location, start_datetime, end_datetime, type, color, is_all_day } = req.body;
    if (!title || !start_datetime || !end_datetime) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็น' });
    }
    const [result] = await pool.execute(
      'INSERT INTO events (title, description, location, start_datetime, end_datetime, type, color, is_all_day, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, description || null, location || null, start_datetime, end_datetime,
       type || 'club', color || '#0288D1', is_all_day ? 1 : 0, req.user.id]
    );
    res.status(201).json({ success: true, message: 'เพิ่มกิจกรรมสำเร็จ', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/events/:id
router.put('/:id', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });

    const { title, description, location, start_datetime, end_datetime, type, color, is_all_day } = req.body;
    const e = existing[0];
    await pool.execute(
      'UPDATE events SET title=?, description=?, location=?, start_datetime=?, end_datetime=?, type=?, color=?, is_all_day=? WHERE id=?',
      [title||e.title, description||e.description, location||e.location,
       start_datetime||e.start_datetime, end_datetime||e.end_datetime,
       type||e.type, color||e.color, is_all_day !== undefined ? (is_all_day ? 1 : 0) : e.is_all_day,
       req.params.id]
    );
    res.json({ success: true, message: 'แก้ไขกิจกรรมสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id FROM events WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบกิจกรรมสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
