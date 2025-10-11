const express = require('express');
const { addReaction, removeReaction, getReactions } = require('../controllers/reactionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/:postId', authenticateToken, addReaction);
router.delete('/:postId', authenticateToken, removeReaction);
router.get('/:postId', authenticateToken, getReactions);

module.exports = router;
