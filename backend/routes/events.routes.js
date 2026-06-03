const express = require('express');
const router = express.Router();
const { execute, executeInsert } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/events — all events with optional month/type filter
router.get('/', async (req, res) => {
  try {
    const { month, year, type } = req.query;
    let where = [];
    let params = [];

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const nm = m % 12 + 1;
      const ny = nm === 1 ? y + 1 : y;
      const monthStart = `${y}-${String(m).padStart(2,'0')}-01`;
      const monthEnd   = `${ny}-${String(nm).padStart(2,'0')}-01`;
      // Overlap check; DATEADD replaces MySQL DATE_SUB for UTC+7 shift
      where.push('start_datetime < ? AND end_datetime >= ?::TIMESTAMP - INTERVAL \'7 hours\'');
      params.push(monthEnd, monthStart);
    }
    if (type) {
      where.push('e.type = ?');
      params.push(type);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await execute(
      `SELECT e.*, u.full_name as creator_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       ${whereClause}
       ORDER BY e.start_datetime ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/events/upcoming — next 5 upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const [rows] = await execute(
      `SELECT e.*, u.full_name as creator_name
       FROM events e JOIN users u ON e.created_by = u.id
       WHERE e.start_datetime >= CURRENT_TIMESTAMP
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
    const [rows] = await execute(
      `SELECT e.*, u.full_name as creator_name FROM events e
       JOIN users u ON e.created_by = u.id WHERE e.id = ?`,
      [parseInt(req.params.id)]
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
    const newId = await executeInsert(
      'INSERT INTO events (title, description, location, start_datetime, end_datetime, type, color, is_all_day, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, description || null, location || null, start_datetime, end_datetime,
       type || 'club', color || '#0288D1', is_all_day ? true : false, req.user.id]
    );
    res.status(201).json({ success: true, message: 'เพิ่มกิจกรรมสำเร็จ', id: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/events/:id
router.put('/:id', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const [existing] = await execute('SELECT * FROM events WHERE id = ?', [parseInt(req.params.id)]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });

    const { title, description, location, start_datetime, end_datetime, type, color, is_all_day } = req.body;
    const e = existing[0];
    await execute(
      'UPDATE events SET title=?, description=?, location=?, start_datetime=?, end_datetime=?, type=?, color=?, is_all_day=? WHERE id=?',
      [title||e.title, description||e.description, location||e.location,
       start_datetime||e.start_datetime, end_datetime||e.end_datetime,
       type||e.type, color||e.color,
       is_all_day !== undefined ? (is_all_day ? true : false) : e.is_all_day,
       parseInt(req.params.id)]
    );
    res.json({ success: true, message: 'แก้ไขกิจกรรมสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const [existing] = await execute('SELECT id FROM events WHERE id = ?', [parseInt(req.params.id)]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    await execute('DELETE FROM events WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true, message: 'ลบกิจกรรมสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
