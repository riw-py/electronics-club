const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/dashboard/stats — admin only
router.get('/stats', authenticate, authorize('admin', 'committee'), async (req, res) => {
  try {
    const [[users]]     = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const [[news]]      = await pool.execute('SELECT COUNT(*) as count FROM news WHERE is_published = 1');
    const [[events]]    = await pool.execute('SELECT COUNT(*) as count FROM events WHERE start_datetime >= NOW()');
    const [[documents]] = await pool.execute('SELECT COUNT(*) as count FROM documents');
    const [recentNews]  = await pool.execute(
      `SELECT n.id, n.title, n.category, n.view_count, n.created_at, u.full_name as author
       FROM news n JOIN users u ON n.author_id = u.id ORDER BY n.created_at DESC LIMIT 5`
    );
    const [upcomingEvents] = await pool.execute(
      `SELECT id, title, type, color, start_datetime, location
       FROM events WHERE start_datetime >= NOW() ORDER BY start_datetime ASC LIMIT 5`
    );
    const [membersByRole] = await pool.execute(
      `SELECT role, COUNT(*) as count FROM users WHERE is_active = 1 GROUP BY role`
    );

    res.json({
      success: true,
      data: {
        stats: {
          total_members: users.count,
          published_news: news.count,
          upcoming_events: events.count,
          total_documents: documents.count,
        },
        recentNews,
        upcomingEvents,
        membersByRole
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
