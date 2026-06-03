const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { execute, executeInsert } = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadGarbage } = require('../middleware/upload');

// Admin: Add duties
router.post('/schedule', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const { duties } = req.body; // Array of { date, shift, classroom }
    if (!duties || !duties.length) return res.status(400).json({ success: false, message: 'Invalid data' });

    const values = [];
    const placeholders = [];
    duties.forEach(d => {
      values.push(d.date, d.shift, d.classroom, req.user.id);
      placeholders.push('(?, ?, ?, ?)');
    });

    await execute(
      `INSERT INTO garbage_duties (duty_date, shift, classroom, assigned_by) VALUES ${placeholders.join(',')}`,
      values
    );
    res.json({ success: true, message: 'บันทึกตารางเวรสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET Schedule
router.get('/schedule', async (req, res) => {
  try {
    const { month, year } = req.query;
    let whereClause = '';
    let params = [];
    if (month && year) {
      whereClause = 'WHERE EXTRACT(MONTH FROM duty_date) = ? AND EXTRACT(YEAR FROM duty_date) = ?';
      params.push(parseInt(month), parseInt(year));
    }
    const [rows] = await execute(`SELECT * FROM garbage_duties ${whereClause} ORDER BY duty_date, shift DESC`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE Schedule
router.delete('/schedule/:id', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    await execute('DELETE FROM garbage_duties WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true, message: 'ลบเวรสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// Member: Submit report
router.post('/report', authenticate, uploadGarbage.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปภาพ' });
    const { duty_id, classroom, co_workers } = req.body; // duty_id can be null if extra_help
    
    const imageUrl = `/uploads/garbage/${req.file.filename}`;
    
    await executeInsert(
      `INSERT INTO garbage_reports (duty_id, classroom, reported_by, image_url, status, co_workers) 
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [duty_id || null, classroom, req.user.id, imageUrl, co_workers || null]
    );

    res.json({ success: true, message: 'ส่งงานสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// Admin: Review report / Update score
router.put('/report/:id/status', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const { status } = req.body; // completed, missed, not_clean, extra_help
    let modifier = 0;
    if (status === 'missed') modifier = 1.0;
    else if (status === 'not_clean') modifier = 0.5;
    else if (status === 'extra_help') modifier = -0.5;
    else if (status === 'completed') modifier = 0;

    await execute(
      `UPDATE garbage_reports SET status = ?, score_modifier = ?, inspector_id = ? WHERE id = ?`,
      [status, modifier, req.user.id, parseInt(req.params.id)]
    );

    res.json({ success: true, message: 'บันทึกการตรวจสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// Admin: Missing report auto-add (If someone didn't submit)
router.post('/report/missed', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const { duty_id, classroom } = req.body;
    await executeInsert(
      `INSERT INTO garbage_reports (duty_id, classroom, reported_by, image_url, status, score_modifier, inspector_id) 
       VALUES (?, ?, ?, '', 'missed', 1.0, ?)`,
      [duty_id, classroom, req.user.id, req.user.id]
    );
    res.json({ success: true, message: 'บันทึกขาดเวรสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET Reports
router.get('/reports', async (req, res) => {
  try {
    const [rows] = await execute(`
      SELECT r.*, d.duty_date, d.shift, 
             u.full_name as reporter_name,
             i.full_name as inspector_name
      FROM garbage_reports r
      LEFT JOIN garbage_duties d ON r.duty_id = d.id
      LEFT JOIN users u ON r.reported_by = u.id
      LEFT JOIN users i ON r.inspector_id = i.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET Scoreboard
router.get('/scoreboard', async (req, res) => {
  try {
    // List all 8 classrooms and sum their score modifiers
    const rooms = ['ชอ.1/1', 'ชอ.1/2', 'ชอ.2/1', 'ชอ.2/2', 'ชอ.3/1', 'ชอ.3/2', 'สทอ.1/1', 'สทอ.1/2'];
    
    const [rows] = await execute(`
      SELECT classroom, SUM(score_modifier) as total_score
      FROM garbage_reports
      WHERE status != 'pending'
      GROUP BY classroom
    `);
    
    const scoreMap = {};
    rows.forEach(r => scoreMap[r.classroom] = parseFloat(r.total_score));

    const result = rooms.map(room => ({
      classroom: room,
      score: scoreMap[room] || 0
    }));

    // Rank: Lowest score is best
    result.sort((a, b) => a.score - b.score);
    
    let rank = 1;
    result.forEach((r, i) => {
      if (i > 0 && r.score === result[i-1].score) r.rank = result[i-1].rank;
      else r.rank = rank;
      rank++;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET Dashboard (Today)
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [duties] = await execute('SELECT * FROM garbage_duties WHERE duty_date = ?', [today]);
    
    // Recent reports for today
    const [reports] = await execute(`
      SELECT r.*, u.full_name as reporter_name
      FROM garbage_reports r
      JOIN users u ON r.reported_by = u.id
      WHERE r.created_at::date = ?
      ORDER BY r.created_at DESC
    `, [today]);

    res.json({ success: true, data: { today: today, duties, reports } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
