const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  acceptRelationship, 
  rejectRelationship, 
  cancelRelationship, 
  getRelationshipStatus 
} = require('../controllers/relationshipController');

router.post('/accept', authenticateToken, acceptRelationship);
router.post('/reject', authenticateToken, rejectRelationship);
router.post('/cancel', authenticateToken, cancelRelationship);
router.get('/status/:userId', authenticateToken, getRelationshipStatus);

module.exports = router;
