const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getStreak, getUserStreaks } = require('../controllers/streakController');

// Get streak with specific user
router.get('/:userId', authenticateToken, getStreak);

// Get all user's milestone streaks (for profile)
router.get('/', authenticateToken, getUserStreaks);

module.exports = router;
