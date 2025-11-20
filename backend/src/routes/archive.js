const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  archiveMessages,
  archiveNotifications,
  runFullArchive,
  getArchiveStatus,
  getOldMessages,
  getOldNotifications
} = require('../controllers/archiveController');

router.post('/archive/messages', authenticateToken, archiveMessages);
router.post('/archive/notifications', authenticateToken, archiveNotifications);
router.post('/archive/run', authenticateToken, runFullArchive);
router.get('/archive/status', authenticateToken, getArchiveStatus);
router.get('/archive/messages', authenticateToken, getOldMessages);
router.get('/archive/notifications', authenticateToken, getOldNotifications);

module.exports = router;
