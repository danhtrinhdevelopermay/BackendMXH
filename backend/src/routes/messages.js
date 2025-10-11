const express = require('express');
const { sendMessage, getConversations, getMessages } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, sendMessage);
router.get('/conversations', authenticateToken, getConversations);
router.get('/:userId', authenticateToken, getMessages);

module.exports = router;
