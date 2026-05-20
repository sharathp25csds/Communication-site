const db = require('../config/db');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
const getAdminStats = async (req, res, next) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role != "admin"');
    const [[calls]] = await db.query('SELECT COUNT(*) as count FROM calls');
    const [[reports]] = await db.query('SELECT COUNT(*) as count FROM reports');
    const [[aiChats]] = await db.query('SELECT COUNT(*) as count FROM ai_chats');

    // Recent activity
    const [recentUsers] = await db.query('SELECT id, name, email, created_at FROM users WHERE role != "admin" ORDER BY created_at DESC LIMIT 5');

    res.json({
      success: true,
      stats: {
        totalUsers: users.count,
        totalCalls: calls.count,
        totalReports: reports.count,
        totalAiChats: aiChats.count
      },
      recentUsers
    });
  } catch (error) {
    next(error);
  }
};

const getAdminCalls = async (req, res, next) => {
  try {
    const [calls] = await db.query(`
      SELECT c.id, c.duration, c.created_at, c.contact_name, c.language, c.transcript, u.name as user_name 
      FROM calls c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC LIMIT 50
    `);
    res.json({ success: true, calls });
  } catch (error) {
    next(error);
  }
};

const getAdminReports = async (req, res, next) => {
  try {
    const [reports] = await db.query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM reports r 
      JOIN users u ON r.user_id = u.id 
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT id, name, email, created_at FROM users WHERE role != "admin" ORDER BY created_at DESC');
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminStats, getAdminCalls, getAdminReports, getAdminUsers };
