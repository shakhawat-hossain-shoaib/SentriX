const express = require('express');
const router = express.Router();
const iocController = require('../controllers/iocController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ANALYST', 'ADMIN'), iocController.listIocs);
router.get('/:id', verifyToken, requireRole('ANALYST', 'ADMIN'), iocController.getIocDetails);

module.exports = router;
