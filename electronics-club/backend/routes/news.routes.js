const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadNewsImage } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// GET /api/news — public list with pagination + search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, published } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (published !== 'all') { where.push('n.is_published = 1'); }
    if (category)  { where.push('n.category = ?'); params.push(category); }
    if (search)    { where.push('(n.title LIKE ? OR n.excerpt LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM news n ${whereClause}`, params
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT n.id, n.title, n.excerpt, n.image_url, n.category, n.is_published,
              n.view_count, n.created_at, n.updated_at,
              u.full_name as author_name, u.avatar as author_avatar
       FROM news n
       JOIN users u ON n.author_id = u.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/news/:id — single news + increment view
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT n.*, u.full_name as author_name, u.avatar as author_avatar
       FROM news n JOIN users u ON n.author_id = u.id WHERE n.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบข่าวสาร' });
    await pool.execute('UPDATE news SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/news — create (committee+)
router.post('/', authenticate, authorize('admin', 'committee'),
  uploadNewsImage.single('image'), async (req, res) => {
  try {
    const { title, content, excerpt, category, is_published } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อและเนื้อหาข่าว' });
    }
    const image_url = req.file ? `/uploads/news/${req.file.filename}` : null;
    const [result] = await pool.execute(
      'INSERT INTO news (title, content, excerpt, image_url, category, is_published, author_id) VALUES (?,?,?,?,?,?,?)',
      [title, content, excerpt || content.substring(0, 200), image_url, category || 'general',
       is_published === 'true' || is_published === true ? 1 : 0, req.user.id]
    );
    res.status(201).json({ success: true, message: 'เพิ่มข่าวสารสำเร็จ', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มข่าว' });
  }
});

// PUT /api/news/:id — update
router.put('/:id', authenticate, authorize('admin', 'committee'),
  uploadNewsImage.single('image'), async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'ไม่พบข่าวสาร' });

    // Only owner or admin can edit
    if (existing[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์แก้ไขข่าวนี้' });
    }

    const { title, content, excerpt, category, is_published } = req.body;
    let image_url = existing[0].image_url;

    if (req.file) {
      // Delete old image
      if (image_url) {
        const oldPath = path.join(__dirname, '..', '..', image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image_url = `/uploads/news/${req.file.filename}`;
    }

    await pool.execute(
      'UPDATE news SET title=?, content=?, excerpt=?, image_url=?, category=?, is_published=? WHERE id=?',
      [title || existing[0].title, content || existing[0].content,
       excerpt || existing[0].excerpt, image_url,
       category || existing[0].category,
       is_published === 'true' || is_published === true ? 1 : 0,
       req.params.id]
    );
    res.json({ success: true, message: 'แก้ไขข่าวสารสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/news/:id
router.delete('/:id', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'ไม่พบข่าวสาร' });

    if (existing[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบข่าวนี้' });
    }

    if (existing[0].image_url) {
      const imgPath = path.join(__dirname, '..', '..', existing[0].image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await pool.execute('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบข่าวสารสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
