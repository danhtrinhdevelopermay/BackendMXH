const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').optional().trim()
], register);

router.post('/login', [
  body('username').notEmpty().withMessage('Username or email required'),
  body('password').notEmpty().withMessage('Password required')
], login);

router.get('/profile', authenticateToken, getProfile);

module.exports = router;
