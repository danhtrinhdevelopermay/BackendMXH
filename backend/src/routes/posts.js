const express = require('express');
const { createPost, getNewsFeed, getUserPosts, deletePost, searchPosts, getUserLikedPosts } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createPost);
router.get('/feed', authenticateToken, getNewsFeed);
router.get('/search', authenticateToken, searchPosts);
router.get('/user/:userId', authenticateToken, getUserPosts);
router.get('/user/:userId/liked', authenticateToken, getUserLikedPosts);
router.delete('/:postId', authenticateToken, deletePost);

module.exports = router;
