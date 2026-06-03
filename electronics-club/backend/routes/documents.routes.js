const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

const FILE_TYPE_MAP = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'image/jpeg': 'JPG', 'image/png': 'PNG',
  'text/plain': 'TXT'
};

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (category) { where.push('d.category = ?'); params.push(category); }
    if (search) {
      where.push('(d.title LIKE ? OR d.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM documents d ${whereClause}`, params
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT d.id, d.title, d.description, d.filename, d.original_name, d.file_type,
              d.file_size, d.category, d.download_count, d.created_at,
              u.full_name as uploader_name, u.avatar as uploader_avatar
       FROM documents d JOIN users u ON d.uploaded_by = u.id
       ${whereClause}
       ORDER BY d.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/documents/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const doc = rows[0];
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'documents', doc.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });
    }

    await pool.execute('UPDATE documents SET download_count = download_count + 1 WHERE id = ?', [doc.id]);
    res.download(filePath, doc.original_name);
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/documents
router.post('/', authenticate, uploadDocument.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์' });
    const { title, description, category } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อเอกสาร' });

    const fileType = FILE_TYPE_MAP[req.file.mimetype] || 'FILE';
    const [result] = await pool.execute(
      'INSERT INTO documents (title, description, filename, original_name, file_type, file_size, category, uploaded_by) VALUES (?,?,?,?,?,?,?,?)',
      [title, description || null, req.file.filename, req.file.originalname,
       fileType, req.file.size, category || 'other', req.user.id]
    );
    res.status(201).json({ success: true, message: 'อัปโหลดเอกสารสำเร็จ', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลด' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const doc = rows[0];
    if (doc.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบเอกสารนี้' });
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', 'documents', doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบเอกสารสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
