const pool = require('../config/database');
const { 
  archiveOldMessagesToDrive, 
  archiveOldNotificationsToDrive,
  getArchivedMessages,
  getArchivedNotifications
} = require('../services/googleDriveService');

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
  getOldMessages,
  getOldNotifications
};
