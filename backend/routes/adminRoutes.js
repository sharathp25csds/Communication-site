const express = require('express');
const router = express.Router();
const { getAdminStats, getAdminCalls, getAdminReports, getAdminUsers } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.use(protect, adminProtect);

router.get('/stats', getAdminStats);
router.get('/calls', getAdminCalls);
router.get('/reports', getAdminReports);
router.get('/users', getAdminUsers);

module.exports = router;
