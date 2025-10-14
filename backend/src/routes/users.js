const express = require('express');
const { getUserById, getUserStats } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', authenticateToken, getUserById);
router.get('/:userId/stats', authenticateToken, getUserStats);

module.exports = router;
