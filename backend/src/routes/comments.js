const express = require('express');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/:postId', authenticateToken, addComment);
router.get('/:postId', authenticateToken, getComments);
router.delete('/:commentId', authenticateToken, deleteComment);

module.exports = router;
