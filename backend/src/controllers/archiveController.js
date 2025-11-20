const pool = require('../config/database');
const { 
  archiveOldMessagesToDrive, 
  archiveOldNotificationsToDrive,
  getArchivedMessages,
  getArchivedNotifications
} = require('../services/googleDriveService');
const archiveService = require('../services/archiveService');

const archiveMessages = async (req, res) => {
  try {
    const result = await archiveOldMessagesToDrive(pool);
    res.json({
      success: true,
      message: `Archived ${result.archived} messages`,
      fileId: result.fileId
    });
  } catch (error) {
    console.error('Archive messages error:', error);
    res.status(500).json({ error: 'Failed to archive messages' });
  }
};

const archiveNotifications = async (req, res) => {
  try {
    const result = await archiveOldNotificationsToDrive(pool);
    res.json({
      success: true,
      message: `Archived ${result.archived} notifications`,
      fileId: result.fileId
    });
  } catch (error) {
    console.error('Archive notifications error:', error);
    res.status(500).json({ error: 'Failed to archive notifications' });
  }
};

const runFullArchive = async (req, res) => {
  try {
    const result = await archiveService.runArchive();
    res.json(result);
  } catch (error) {
    console.error('Run archive error:', error);
    res.status(500).json({ error: 'Failed to run archive' });
  }
};

const getArchiveStatus = async (req, res) => {
  try {
    const status = archiveService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Get archive status error:', error);
    res.status(500).json({ error: 'Failed to get archive status' });
  }
};

const getOldMessages = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await getArchivedMessages(user_id);
    res.json(result);
  } catch (error) {
    console.error('Get archived messages error:', error);
    res.status(500).json({ error: 'Failed to get archived messages' });
  }
};

const getOldNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await getArchivedNotifications(user_id);
    res.json(result);
  } catch (error) {
    console.error('Get archived notifications error:', error);
    res.status(500).json({ error: 'Failed to get archived notifications' });
  }
};

module.exports = {
  archiveMessages,
  archiveNotifications,
  runFullArchive,
  getArchiveStatus,
  getOldMessages,
  getOldNotifications
};
