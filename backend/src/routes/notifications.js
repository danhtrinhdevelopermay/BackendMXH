const express = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.put('/:notificationId/read', authenticateToken, markAsRead);
router.put('/read-all', authenticateToken, markAllAsRead);

module.exports = router;
