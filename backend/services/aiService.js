const { generateText, CONFIDENCE_THRESHOLD } = require('../config/ai');
const { CATEGORIES } = require('../config/constants');
const { CLASSIFY_SYSTEM, buildClassifyPrompt } = require('../prompts/classify.prompt');
const { EXPLAIN_SYSTEM, buildExplainPrompt } = require('../prompts/explain.prompt');
const { formatEvidence, getConfig } = require('./policyService');
const logger = require('../utils/logger');

// Model kabhi-kabhi ```json fences ke saath jawab deta hai
const parseJSON = (text) => {
  const cleaned = String(text || '')
    .replace(/```json|```/gi, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('AI returned invalid JSON');
  }
};

// ---------------- Classification ----------------

const normalizeClassification = (raw, threshold = CONFIDENCE_THRESHOLD) => {
  const category = CATEGORIES.find(
    (c) => c.toLowerCase() === String(raw && raw.category).trim().toLowerCase()
  );
  if (!category) {
    throw new Error(`AI returned an unknown category: ${raw && raw.category}`);
  }

  let confidence = Number(raw.confidence);
  if (!Number.isFinite(confidence)) {
    throw new Error('AI returned an invalid confidence');
  }
  if (confidence > 1 && confidence <= 100) confidence = confidence / 100; // 94 -> 0.94
  confidence = Math.min(1, Math.max(0, confidence));

  return {
    category,
    confidence,
    isUncertain: confidence < threshold,
    reason: String(raw.reason || '').trim().slice(0, 300),
  };
};

const classifyClaim = async (description, { log = logger } = {}) => {
  const text = await generateText({
    system: CLASSIFY_SYSTEM,
    prompt: buildClassifyPrompt(description),
    json: true,
    operation: 'classify',
    log,
  });

  try {
    const result = normalizeClassification(parseJSON(text));
    log.info('ai_classify_result', {
      category: result.category,
      confidence: result.confidence,
      isUncertain: result.isUncertain,
    });
    return result;
  } catch (error) {
    log.warn('ai_output_rejected', { operation: 'classify', reason: error.message });
    throw error;
  }
};

// Model kabhi-kabhi ").However" ya "5,000(Section" jaisa spacing glitch deta hai
const fixSpacing = (text) =>
  text.replace(/([.!?])(?=[A-Z])/g, '$1 ').replace(/([0-9a-z])\(/g, '$1 (');

// ---------------- Explanation ----------------

// AI ke explanation output ko check karna
const normalizeExplanation = (raw, sections, { allowQuestions = true } = {}) => {
    const explanation = fixSpacing(String((raw && raw.explanation) || '').trim());
  if (!explanation) throw new Error('AI returned an empty explanation');

  // Sirf wahi section IDs jo humne diye the (hallucinated citations hata do)
  const allowed = new Set(sections.map((s) => s.sectionId));
  const cited = Array.isArray(raw.citedSectionIds) ? raw.citedSectionIds : [];
  const citedSectionIds = [
    ...new Set(cited.map((id) => String(id).trim()).filter((id) => allowed.has(id))),
  ];

    const rawQuestions = allowQuestions && Array.isArray(raw.questions) ? raw.questions : [];
  const questions = rawQuestions
    .map((q) => String(q).trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((q) => q.slice(0, 200));

  return { explanation: explanation.slice(0, 1000), citedSectionIds, questions };
};

// Finding ka mukhya section: pehle fail hua limit, phir receipt, date, currency
const PRIMARY_CHECK_ORDER = ['limit', 'receipt', 'date', 'currency'];

const pickPrimarySection = (sections, validationResults = []) => {
  for (const check of PRIMARY_CHECK_ORDER) {
    const failed = validationResults.find((r) => r.check === check && !r.passed && r.sectionId);
    if (failed) {
      const section = sections.find((s) => s.sectionId === failed.sectionId);
      if (section) return section;
    }
  }
  const limitSection = sections.find((s) => s.reasons && s.reasons.includes('limit'));
  return limitSection || sections[0] || null;
};

// Evidence hamesha code decide karta hai: primary section pehle, phir AI ke verified citations
const buildEvidence = (citedSectionIds, sections, validationResults) => {
  const primary = pickPrimarySection(sections, validationResults);
  if (!primary) return { policySectionId: undefined, policyEvidence: '', evidenceIds: [] };

  const byId = new Map(sections.map((s) => [s.sectionId, s]));
  const evidence = [primary];
  for (const id of citedSectionIds) {
    const section = byId.get(id);
    if (section && section.sectionId !== primary.sectionId) evidence.push(section);
  }

  return {
    policySectionId: primary.sectionId,
    policyEvidence: evidence.map(formatEvidence).join('\n'),
    evidenceIds: evidence.map((s) => s.sectionId),
  };
};

// Sawal tabhi allowed hain jab policy us category me details maangti hai, ya receipt fail hua ho
const shouldAllowQuestions = (category, validationResults = [], config = getConfig()) => {
  const detailsRequired = Boolean(config.categories[category]?.detailsRequired);
  const receiptFailed = validationResults.some((r) => r.check === 'receipt' && !r.passed);
  return detailsRequired || receiptFailed;
};

const explainClaim = async ({
  claim,
  classification,
  validationResults,
  sections,
  log = logger,
}) => {
  const config = getConfig();
  const detailsRequired = Boolean(config.categories[claim.category]?.detailsRequired);
  const allowQuestions = shouldAllowQuestions(claim.category, validationResults, config);

  const text = await generateText({
    system: EXPLAIN_SYSTEM,
    prompt: buildExplainPrompt({
      claim,
      classification,
      validationResults,
      sections,
      detailsRequired,
    }),
    json: true,
    operation: 'explain',
    log,
  });

  let parsed;
  let normalized;
  try {
    parsed = parseJSON(text);
    normalized = normalizeExplanation(parsed, sections, { allowQuestions });
  } catch (error) {
    log.warn('ai_output_rejected', { operation: 'explain', reason: error.message });
    throw error;
  }

  const evidence = buildEvidence(normalized.citedSectionIds, sections, validationResults);

  // Guardrails ne kya hataya, wo bhi record karo
  const rawCited = Array.isArray(parsed.citedSectionIds) ? parsed.citedSectionIds.length : 0;
  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions.length : 0;
  log.info('ai_explain_result', {
    questionCount: normalized.questions.length,
    questionsSuppressed: !allowQuestions && rawQuestions > 0,
    droppedCitations: Math.max(0, rawCited - normalized.citedSectionIds.length),
    evidenceIds: evidence.evidenceIds,
  });

  return {
    explanation: normalized.explanation,
    questions: normalized.questions,
    policySectionId: evidence.policySectionId,
    policyEvidence: evidence.policyEvidence,
    evidenceIds: evidence.evidenceIds,
  };
};

module.exports = {
  classifyClaim,
  explainClaim,
  parseJSON,
  normalizeClassification,
  fixSpacing,
  normalizeExplanation,
  shouldAllowQuestions,
  pickPrimarySection,
  buildEvidence,
};