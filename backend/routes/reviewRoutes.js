const express = require('express');
const {
  approveClaim,
  rejectClaim,
  requestClarification,
  overrideClassification,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.patch('/:id/approve', protect, restrictTo(ROLES.REVIEWER), approveClaim);
router.patch('/:id/reject', protect, restrictTo(ROLES.REVIEWER), rejectClaim);
router.patch('/:id/clarify', protect, restrictTo(ROLES.REVIEWER), requestClarification);
router.patch('/:id/override', protect, restrictTo(ROLES.REVIEWER), overrideClassification);

module.exports = router;