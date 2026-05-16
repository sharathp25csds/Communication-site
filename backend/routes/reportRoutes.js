const express = require('express');
const router = express.Router();
const { createReport, updateReportStatus, getMyReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.post('/create', protect, createReport);
router.get('/', protect, getMyReports);
router.put('/status/:id', protect, adminProtect, updateReportStatus);

module.exports = router;
