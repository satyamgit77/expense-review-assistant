const express = require('express');
const { listSections, getSection } = require('../controllers/policyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, listSections);
router.get('/:sectionId', protect, getSection);

module.exports = router;