const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createStory, getAllStories, getUserStories, deleteStory } = require('../controllers/storyController');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/', authenticateToken, upload.single('media'), createStory);
router.get('/', authenticateToken, getAllStories);
router.get('/user/:userId', authenticateToken, getUserStories);
router.delete('/:storyId', authenticateToken, deleteStory);

module.exports = router;
