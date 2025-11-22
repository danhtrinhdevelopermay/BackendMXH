const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const reelsController = require('../controllers/reelsController');

// Get reels (video posts)
router.get('/', auth, reelsController.getCombinedReels);

// Get TikTok videos
router.get('/tiktok', auth, reelsController.getTikTokVideos);

// Get database videos only
router.get('/database', auth, reelsController.getReels);

module.exports = router;
