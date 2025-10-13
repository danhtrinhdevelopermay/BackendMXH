const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createStory, getAllStories, getUserStories, deleteStory } = require('../controllers/storyController');
const { auth } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/', auth, upload.single('media'), createStory);
router.get('/', auth, getAllStories);
router.get('/user/:userId', auth, getUserStories);
router.delete('/:storyId', auth, deleteStory);

module.exports = router;
