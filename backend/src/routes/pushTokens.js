const express = require('express');
const { registerPushToken, deletePushToken } = require('../controllers/pushTokenController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authenticateToken, registerPushToken);
router.post('/delete', authenticateToken, deletePushToken);

module.exports = router;
