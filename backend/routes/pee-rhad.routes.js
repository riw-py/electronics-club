const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { execute, executeInsert } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ============================================================
// POST /api/pee-rhad/seniors
// Register a new senior (mentor)
// ============================================================
router.post('/seniors', [
  body('code').notEmpty().withMessage('รหัส Pee ห้ามว่าง'),
  body('fullname').notEmpty().withMessage('ชื่อ-นามสกุล ห้ามว่าง'),
  body('hint').notEmpty().withMessage('คำใบ้ ห้ามว่าง'),
  body('max_juniors').optional().isInt({ min: 1 }).withMessage('จำนวน Juniors ต้องเป็นตัวเลขบวก'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { code, fullname, hint, max_juniors = 2 } = req.body;

  try {
    // Check if code already exists
    const [existing] = await execute(
      'SELECT id FROM seniors WHERE code = ?',
      [code]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'รหัส Pee นี้ถูกใช้งานแล้ว'
      });
    }

    // Insert new senior
    const seniorId = await executeInsert(
      'INSERT INTO seniors (code, fullname, hint, max_juniors) VALUES (?, ?, ?, ?)',
      [code, fullname, hint, max_juniors]
    );

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียน Pee สำเร็จ',
      data: {
        id: seniorId,
        code,
        fullname,
        hint,
        max_juniors,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error registering senior:', err);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน Pee',
      error: err.message
    });
  }
});

// ============================================================
// GET /api/pee-rhad/seniors
// Get all seniors (with junior count)
// ============================================================
router.get('/seniors', async (req, res) => {
  try {
    const [seniors] = await execute(
      `SELECT 
        s.id, 
        s.code, 
        s.fullname, 
        s.hint, 
        s.max_juniors,
        s.created_at,
        COUNT(jm.id) as junior_count
      FROM seniors s
      LEFT JOIN junior_matches jm ON s.id = jm.senior_id
      GROUP BY s.id, s.code, s.fullname, s.hint, s.max_juniors, s.created_at
      ORDER BY s.created_at DESC`
    );

    res.json({
      success: true,
      data: seniors
    });
  } catch (err) {
    console.error('Error fetching seniors:', err);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Pee',
      error: err.message
    });
  }
});

// ============================================================
// POST /api/pee-rhad/select
// Junior selects/matches with a senior
// ============================================================
router.post('/select', [
  body('senior_id').isInt().withMessage('Senior ID ไม่ถูกต้อง'),
  body('junior_name').notEmpty().withMessage('ชื่อ Junior ห้ามว่าง'),
  body('junior_level').notEmpty().withMessage('ระดับ Junior ห้ามว่าง'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { senior_id, junior_name, junior_level } = req.body;

  try {
    // Check if senior exists
    const [senior] = await execute(
      'SELECT id, max_juniors FROM seniors WHERE id = ?',
      [senior_id]
    );

    if (senior.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Pee ที่ระบุ'
      });
    }

    // Check if senior has reached max juniors
    const [juniorCount] = await execute(
      'SELECT COUNT(*) as count FROM junior_matches WHERE senior_id = ?',
      [senior_id]
    );

    if (juniorCount[0].count >= senior[0].max_juniors) {
      return res.status(409).json({
        success: false,
        message: 'Pee นี้มี Junior เต็มแล้ว'
      });
    }

    // Insert junior match
    const matchId = await executeInsert(
      'INSERT INTO junior_matches (senior_id, junior_name, junior_level) VALUES (?, ?, ?)',
      [senior_id, junior_name, junior_level]
    );

    res.status(201).json({
      success: true,
      message: 'เลือก Pee สำเร็จ',
      data: {
        id: matchId,
        senior_id,
        junior_name,
        junior_level,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error selecting senior:', err);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเลือก Pee',
      error: err.message
    });
  }
});

// ============================================================
// GET /api/pee-rhad/reveal
// Get matched junior information (reveal result)
// ============================================================
router.get('/reveal', async (req, res) => {
  try {
    const [matches] = await execute(
      `SELECT 
        jm.id,
        jm.senior_id,
        jm.junior_name,
        jm.junior_level,
        jm.created_at,
        s.code,
        s.fullname as senior_name,
        s.hint
      FROM junior_matches jm
      JOIN seniors s ON jm.senior_id = s.id
      ORDER BY jm.created_at DESC`
    );

    res.json({
      success: true,
      data: matches
    });
  } catch (err) {
    console.error('Error revealing matches:', err);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเรียกดูผลลัพธ์',
      error: err.message
    });
  }
});

module.exports = router;
