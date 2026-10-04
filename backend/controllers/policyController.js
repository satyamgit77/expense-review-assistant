const policyService = require('../services/policyService');

const listSections = async (req, res) => {
  try {
    const sections = await policyService.getAllSections(req.query.category);
    res.json({ count: sections.length, sections });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to fetch policy', error: error.message });
  }
};

const getSection = async (req, res) => {
  try {
    const section = await policyService.getSectionById(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Policy section not found' });
    }
    res.json({ section });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Failed to fetch section', error: error.message });
  }
};

module.exports = { listSections, getSection };