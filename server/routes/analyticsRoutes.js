const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/overview', verifyToken, requireRole('ANALYST', 'ADMIN'), analyticsController.getOverview);
router.get('/trends', verifyToken, requireRole('ANALYST', 'ADMIN'), analyticsController.getMonthlyTrends);
router.get('/resolution-time', verifyToken, requireRole('ANALYST', 'ADMIN'), analyticsController.getResolutionTime);

module.exports = router;
