const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateText } = require('../controllers/aiController');

router.post('/generate-text', authenticateToken, generateText);

module.exports = router;
