const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sendOTP, verifyOTP, changePasswordWithOTP } = require('../controllers/otpController');

router.post('/send', authenticateToken, sendOTP);

router.post('/verify', authenticateToken, verifyOTP);

router.post('/change-password', authenticateToken, changePasswordWithOTP);

module.exports = router;
