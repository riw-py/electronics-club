const express = require('express');
const router = express.Router();
const { execute } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/dashboard/stats — all users
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [usersCount]     = await execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    const [newsCount]      = await execute('SELECT COUNT(*) as count FROM news WHERE is_published = TRUE');
    const [eventsCount]    = await execute('SELECT COUNT(*) as count FROM events WHERE start_datetime >= CURRENT_TIMESTAMP');
    const [documentsCount] = await execute('SELECT COUNT(*) as count FROM documents');
    const [recentNews]     = await execute(
      `SELECT n.id, n.title, n.category, n.view_count, n.created_at, u.full_name as author
       FROM news n JOIN users u ON n.author_id = u.id ORDER BY n.created_at DESC LIMIT 5`
    );
    const [upcomingEvents] = await execute(
      `SELECT id, title, type, color, start_datetime, location
       FROM events WHERE start_datetime >= CURRENT_TIMESTAMP ORDER BY start_datetime ASC LIMIT 5`
    );
    const [membersByRole] = await execute(
      `SELECT role, COUNT(*) as count FROM users WHERE is_active = TRUE GROUP BY role`
    );

    res.json({
      success: true,
      data: {
        stats: {
          total_members:    usersCount[0].count,
          published_news:   newsCount[0].count,
          upcoming_events:  eventsCount[0].count,
          total_documents:  documentsCount[0].count,
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
