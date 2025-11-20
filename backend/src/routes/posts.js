const express = require('express');
const { createPost, getNewsFeed, getUserPosts, deletePost, searchPosts, getLikedPosts } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createPost);
router.get('/feed', authenticateToken, getNewsFeed);
router.get('/search', authenticateToken, searchPosts);
router.get('/liked', authenticateToken, getLikedPosts);
router.get('/user/:userId', authenticateToken, getUserPosts);
router.delete('/:postId', authenticateToken, deletePost);

module.exports = router;
