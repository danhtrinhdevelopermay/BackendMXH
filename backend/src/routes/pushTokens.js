const express = require('express');
const { registerPushToken, deletePushToken, sendTestNotification } = require('../controllers/pushTokenController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authenticateToken, registerPushToken);
router.post('/delete', authenticateToken, deletePushToken);
router.post('/test', authenticateToken, sendTestNotification);

module.exports = router;
