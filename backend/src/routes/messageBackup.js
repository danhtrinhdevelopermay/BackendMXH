const express = require('express');
const router = express.Router();
const { 
  createBackup, 
  listBackups, 
  restoreBackup, 
  deleteBackup,
  getBackupHistory 
} = require('../controllers/messageBackupController');

router.post('/create', createBackup);
router.get('/list', listBackups);
router.post('/restore', restoreBackup);
router.delete('/:fileId', deleteBackup);
router.get('/history', getBackupHistory);

module.exports = router;
