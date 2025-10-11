const express = require('express');
const { getUserById } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', authenticateToken, getUserById);

module.exports = router;
