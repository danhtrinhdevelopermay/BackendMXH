const express = require('express');
const {
  createOrUpdateThought,
  getAllThoughts,
  getUserThought,
  deleteThought,
} = require('../controllers/thoughtController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createOrUpdateThought);
router.get('/', authenticateToken, getAllThoughts);
router.get('/:userId', authenticateToken, getUserThought);
router.delete('/', authenticateToken, deleteThought);

module.exports = router;
