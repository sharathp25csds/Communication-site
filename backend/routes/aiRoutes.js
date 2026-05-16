const express = require('express');
const router = express.Router();
const { processSTT, processTTS, chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/stt', protect, processSTT);
router.post('/tts', protect, processTTS);
router.post('/chat', protect, chatWithAI);

module.exports = router;
