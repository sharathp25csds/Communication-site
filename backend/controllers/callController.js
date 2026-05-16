const db = require('../config/db');

// @desc    Get user call history
// @route   GET /api/calls/history
const getCallHistory = async (req, res, next) => {
  try {
    const [calls] = await db.execute(
      'SELECT id, contact_name, duration, transcript, language, created_at FROM calls WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, calls });
  } catch (error) {
    next(error);
  }
};

// @desc    Save call transcript/summary
// @route   POST /api/calls/transcript
const saveTranscript = async (req, res, next) => {
  try {
    const { contact_name, duration, transcript, language } = req.body;

    if (!contact_name || !duration) {
      return res.status(400).json({ message: 'Contact name and duration are required' });
    }

    const [result] = await db.execute(
      'INSERT INTO calls (user_id, contact_name, duration, transcript, language) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, contact_name, duration, transcript || '', language || 'en-IN']
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Call summary saved'
    });
    console.log(`💾 Call saved: ${contact_name} (${duration}s) for user ${req.user.id}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Start a call session (tracking)
// @route   POST /api/calls/start
const startCall = async (req, res, next) => {
  try {
    const { contact_name, language } = req.body;
    res.json({
      success: true,
      message: 'Call session started',
      started_at: new Date().toISOString(),
      contact_name: contact_name || 'Unknown',
      language: language || 'en-IN'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End a call session
// @route   POST /api/calls/end
const endCall = async (req, res, next) => {
  try {
    const { contact_name, duration, language } = req.body;

    if (!duration) {
      return res.status(400).json({ message: 'Duration is required' });
    }

    const summary = `Call with ${contact_name || 'Unknown'} — ${duration}s — ${new Date().toLocaleString()}`;

    const [result] = await db.execute(
      'INSERT INTO calls (user_id, contact_name, duration, transcript, language) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, contact_name || 'Unknown', duration, summary, language || 'en-IN']
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Call ended and summary saved',
      duration,
      summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCallHistory, saveTranscript, startCall, endCall };
