const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const {
  archiveMessages,
  archiveNotifications,
  getOldMessages,
  getOldNotifications
} = require('../controllers/archiveController');

router.post('/archive/messages', authenticateToken, archiveMessages);
router.post('/archive/notifications', authenticateToken, archiveNotifications);
router.get('/archive/messages', authenticateToken, getOldMessages);
router.get('/archive/notifications', authenticateToken, getOldNotifications);

module.exports = router;
