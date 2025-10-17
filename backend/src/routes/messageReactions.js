const express = require('express');
const { addMessageReaction, removeMessageReaction, getMessageReactions } = require('../controllers/messageReactionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/:messageId', authenticateToken, addMessageReaction);
router.delete('/:messageId', authenticateToken, removeMessageReaction);
router.get('/:messageId', authenticateToken, getMessageReactions);

module.exports = router;
