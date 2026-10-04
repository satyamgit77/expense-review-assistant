const express = require('express');
const {
  createClaim,
  listClaims,
  getClaim,
  getSummary,
  respondToClarification,
} = require('../controllers/claimController');
const { claimSubmitLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, claimSubmitLimiter, createClaim);
router.get('/', protect, listClaims);
router.get('/summary', protect, getSummary);
router.get('/:id', protect, getClaim);
router.patch('/:id/respond', protect, respondToClarification);

module.exports = router;