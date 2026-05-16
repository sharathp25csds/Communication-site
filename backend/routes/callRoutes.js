const express = require('express');
const router = express.Router();
const { getCallHistory, saveTranscript, startCall, endCall } = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, getCallHistory);
router.post('/transcript', protect, saveTranscript);
router.post('/start', protect, startCall);
router.post('/end', protect, endCall);

module.exports = router;
