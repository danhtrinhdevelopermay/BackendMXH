const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateText, generateIceBreaker } = require('../controllers/aiController');

router.post('/generate-text', authenticateToken, generateText);
router.post('/generate-ice-breaker', authenticateToken, generateIceBreaker);

module.exports = router;
