const fs = require('fs');
const path = require('path');
const PolicySection = require('../models/PolicySection');

const CONFIG_PATH = path.join(__dirname, '../../policy/policy.config.json');

let cachedConfig = null;

// Numbers (limits, receipt rule, dates) policy.config.json se aate hain
const getConfig = () => {
  if (!cachedConfig) {
    cachedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
  return cachedConfig;
};

const getAllSections = async (category) => {
  const filter = category ? { category } : {};
  return PolicySection.find(filter).sort({ sectionId: 1 });
};

const getSectionById = async (sectionId) => {
  return PolicySection.findOne({ sectionId });
};

// Category ka limit wala section (e.g. Meals -> 3.2)
const getLimitSection = async (category) => {
  const catConfig = getConfig().categories[category];
  if (!catConfig) return null;
  return getSectionById(catConfig.limitSectionId);
};

// Receipt rule wala section (1.2)
const getReceiptSection = async () => {
  return getSectionById(getConfig().receipt.sectionId);
};

// ---- Retrieval (NO AI) ----

// Pure function: kaunse section IDs chahiye (DB ki zaroorat nahi, isliye test aasan)
const selectSectionRefs = (category, validationResults = [], config = getConfig()) => {
  const refs = [];

  const add = (sectionId, reason) => {
    if (!sectionId) return;
    const existing = refs.find((r) => r.sectionId === sectionId);
    if (existing) {
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      return;
    }
    refs.push({ sectionId, reasons: [reason] });
  };

  const catConfig = config.categories[category];
  if (catConfig) {
    add(catConfig.limitSectionId, 'limit');
    add(catConfig.detailsSectionId, 'details');
  }

  // Sirf fail hue checks ke sections
  for (const r of validationResults) {
    if (!r.passed && r.sectionId) add(r.sectionId, `${r.check} check failed`);
  }

  return refs.sort((a, b) =>
    a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true })
  );
};

// DB se in sections ka exact text laata hai
const getRelevantSections = async (category, validationResults = []) => {
  const refs = selectSectionRefs(category, validationResults);
  if (refs.length === 0) return [];

  const docs = await PolicySection.find({
    sectionId: { $in: refs.map((r) => r.sectionId) },
  });
  const byId = new Map(docs.map((d) => [d.sectionId, d]));

  const sections = [];
  for (const ref of refs) {
    const doc = byId.get(ref.sectionId);
    if (!doc) {
      console.warn(`Policy section ${ref.sectionId} not found in DB (run npm run seed:policy)`);
      continue;
    }
    sections.push({
      sectionId: doc.sectionId,
      category: doc.category,
      title: doc.title,
      text: doc.text,
      limitAmount: doc.limitAmount,
      reasons: ref.reasons,
    });
  }
  return sections;
};

// "Meals Policy, Section 3.2 - <exact text>"
const formatEvidence = (section) =>
  `${section.category} Policy, Section ${section.sectionId} - ${section.text}`;

module.exports = {
  getConfig,
  getAllSections,
  getSectionById,
  getLimitSection,
  getReceiptSection,
  selectSectionRefs,
  getRelevantSections,
  formatEvidence,
};