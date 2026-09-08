const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ANALYST', 'ADMIN'), userController.listUsers);
router.get('/:id', verifyToken, userController.getUserById);
router.patch('/:id/status', verifyToken, requireRole('ADMIN'), userController.updateUserStatus);
router.patch('/:id/role', verifyToken, requireRole('ADMIN'), userController.updateUserRole);
router.put('/profile', verifyToken, userController.updateProfile);

module.exports = router;
