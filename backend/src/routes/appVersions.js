const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../../uploads/apk');

fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const versionName = req.body.version_name || 'unknown';
    const filename = `shatter-${versionName}-${timestamp}.apk`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.android.package-archive' || 
        file.originalname.endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Only APK files are allowed'));
    }
  }
});

router.get('/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM app_versions ORDER BY version_code DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        hasUpdate: false,
        message: 'No versions available'
      });
    }

    const latestVersion = result.rows[0];
    
    res.json({
      success: true,
      version: {
        versionName: latestVersion.version_name,
        versionCode: latestVersion.version_code,
        apkUrl: latestVersion.apk_url,
        fileSize: latestVersion.file_size,
        releaseNotes: latestVersion.release_notes,
        isForceUpdate: latestVersion.is_force_update,
        createdAt: latestVersion.created_at
      }
    });
  } catch (error) {
    console.error('Error getting latest version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get latest version'
    });
  }
});

router.get('/check/:currentVersionCode', async (req, res) => {
  try {
    const currentVersionCode = parseInt(req.params.currentVersionCode);
    
    const result = await pool.query(
      'SELECT * FROM app_versions WHERE version_code > $1 ORDER BY version_code DESC LIMIT 1',
      [currentVersionCode]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        hasUpdate: false,
        message: 'App is up to date'
      });
    }

    const newVersion = result.rows[0];
    
    res.json({
      success: true,
      hasUpdate: true,
      update: {
        versionName: newVersion.version_name,
        versionCode: newVersion.version_code,
        apkUrl: newVersion.apk_url,
        fileSize: newVersion.file_size,
        releaseNotes: newVersion.release_notes,
        isForceUpdate: newVersion.is_force_update,
        createdAt: newVersion.created_at
      }
    });
  } catch (error) {
    console.error('Error checking version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check version'
    });
  }
});

router.post('/upload', upload.single('apk'), async (req, res) => {
  try {
    const { version_name, version_code, release_notes, is_force_update } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No APK file uploaded'
      });
    }

    if (!version_name || !version_code) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Version name and code are required'
      });
    }

    const existingVersion = await pool.query(
      'SELECT id FROM app_versions WHERE version_code = $1 OR version_name = $2',
      [parseInt(version_code), version_name]
    );

    if (existingVersion.rows.length > 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Version already exists'
      });
    }

    const apkUrl = `/uploads/apk/${req.file.filename}`;
    const fileSize = req.file.size;

    console.log(`✅ APK saved locally: ${apkUrl}`);

    const result = await pool.query(
      `INSERT INTO app_versions (version_name, version_code, apk_url, file_size, release_notes, is_force_update, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [version_name, parseInt(version_code), apkUrl, fileSize, release_notes, is_force_update === 'true', null]
    );

    res.json({
      success: true,
      message: 'APK uploaded successfully',
      version: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading APK:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to upload APK: ' + error.message
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.full_name as uploaded_by_name 
       FROM app_versions v 
       LEFT JOIN users u ON v.uploaded_by = u.id 
       ORDER BY v.version_code DESC`
    );

    res.json({
      success: true,
      versions: result.rows
    });
  } catch (error) {
    console.error('Error getting versions list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get versions list'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const versionId = req.params.id;
    
    const result = await pool.query(
      'SELECT apk_url FROM app_versions WHERE id = $1',
      [versionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    const apkPath = path.join(__dirname, '../..', result.rows[0].apk_url);
    
    await pool.query('DELETE FROM app_versions WHERE id = $1', [versionId]);
    
    await fs.unlink(apkPath).catch(err => {
      console.warn('Failed to delete APK file:', err);
    });

    res.json({
      success: true,
      message: 'Version deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete version'
    });
  }
});

module.exports = router;
