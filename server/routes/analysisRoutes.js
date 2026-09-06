const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { optionalAuth } = require('../middleware/auth');

router.post('/inspect', optionalAuth, analysisController.inspectThreat);

module.exports = router;
