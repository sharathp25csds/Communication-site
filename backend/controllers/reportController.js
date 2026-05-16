const db = require('../config/db');

// @desc    Create a report
// @route   POST /api/reports/create
const createReport = async (req, res, next) => {
  try {
    const { subject, issue_type, priority, description } = req.body;
    
    if (!issue_type || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await db.query(
      'INSERT INTO reports (user_id, subject, issue_type, priority, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, subject || 'General', issue_type, priority || 'medium', description, 'pending']
    );

    res.status(201).json({ success: true, message: 'Report created successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const [reports] = await db.query('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, updateReportStatus, getMyReports };
