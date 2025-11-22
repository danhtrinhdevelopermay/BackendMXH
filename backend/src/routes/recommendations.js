const express = require('express');
const router = express.Router();
const { getRecommendedPosts, getUserPreferences } = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getRecommendedPosts);
router.get('/preferences', authenticateToken, getUserPreferences);

module.exports = router;
