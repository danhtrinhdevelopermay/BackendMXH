const pool = require('../config/database');
const googleDriveService = require('../services/googleDriveService');

const createBackup = async (req, res) => {
  const userId = req.user.id;
  const { backupData } = req.body;

  try {
    if (!backupData) {
      return res.status(400).json({ error: 'Backup data is required' });
    }

    const result = await googleDriveService.uploadBackupToDrive(
      userId,
      backupData,
      {
        description: `Zalo backup for user ${userId} at ${new Date().toISOString()}`
      }
    );

    await pool.query(
      `INSERT INTO backup_logs (user_id, backup_file_id, backup_file_name, backup_size, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, result.fileId, result.fileName, result.size, 'success']
    );

    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: result
    });
  } catch (error) {
    console.error('Create backup error:', error);
    
    await pool.query(
      `INSERT INTO backup_logs (user_id, status, error_message)
       VALUES ($1, $2, $3)`,
      [userId, 'failed', error.message]
    ).catch(err => console.error('Failed to log backup error:', err));
    
    res.status(500).json({ 
      error: 'Failed to create backup',
      details: error.message 
    });
  }
};

const listBackups = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await googleDriveService.listBackupsFromDrive(userId);

    res.json({
      success: true,
      backups: result.backups
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ 
      error: 'Failed to list backups',
      details: error.message 
    });
  }
};

const restoreBackup = async (req, res) => {
  const userId = req.user.id;
  const { fileId } = req.body;

  try {
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const result = await googleDriveService.downloadBackupFromDrive(fileId);

    if (!result.backup) {
      return res.status(400).json({ error: 'Invalid backup file' });
    }

    await pool.query(
      `INSERT INTO backup_logs (user_id, backup_file_id, status, action)
       VALUES ($1, $2, $3, $4)`,
      [userId, fileId, 'success', 'restore']
    );

    res.json({
      success: true,
      message: 'Backup restored successfully',
      backup: result.backup
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    
    await pool.query(
      `INSERT INTO backup_logs (user_id, backup_file_id, status, action, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, fileId, 'failed', 'restore', error.message]
    ).catch(err => console.error('Failed to log restore error:', err));
    
    res.status(500).json({ 
      error: 'Failed to restore backup',
      details: error.message 
    });
  }
};

const deleteBackup = async (req, res) => {
  const userId = req.user.id;
  const { fileId } = req.params;

  try {
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const result = await googleDriveService.deleteBackupFromDrive(fileId);

    await pool.query(
      `INSERT INTO backup_logs (user_id, backup_file_id, status, action)
       VALUES ($1, $2, $3, $4)`,
      [userId, fileId, 'success', 'delete']
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    
    await pool.query(
      `INSERT INTO backup_logs (user_id, backup_file_id, status, action, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, fileId, 'failed', 'delete', error.message]
    ).catch(err => console.error('Failed to log delete error:', err));
    
    res.status(500).json({ 
      error: 'Failed to delete backup',
      details: error.message 
    });
  }
};

const getBackupHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.queryAll(
      `SELECT * FROM backup_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Get backup history error:', error);
    res.status(500).json({ 
      error: 'Failed to get backup history',
      details: error.message 
    });
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getBackupHistory
};
