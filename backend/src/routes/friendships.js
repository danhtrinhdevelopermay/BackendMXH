const express = require('express');
const { sendFriendRequest, respondToFriendRequest, getFriends, getFriendRequests, searchUsers } = require('../controllers/friendshipController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/request', authenticateToken, sendFriendRequest);
router.put('/request/:requestId', authenticateToken, respondToFriendRequest);
router.get('/friends', authenticateToken, getFriends);
router.get('/requests', authenticateToken, getFriendRequests);
router.get('/search', authenticateToken, searchUsers);

module.exports = router;
