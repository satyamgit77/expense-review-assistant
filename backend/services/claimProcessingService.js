const Claim = require('../models/Claim');
const { CLAIM_STATUS } = require('../config/constants');
const { validateClaimFull } = require('./validationService');
const { getRelevantSections } = require('./policyService');
const { classifyClaim, explainClaim, buildEvidence } = require('./aiService');
const logger = require('../utils/logger');

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30000;

// Sirf ye fields body se liye jayenge. claimant, status, finalCategory,
// validationResults, decisionHistory kabhi body se nahi aate.
const ALLOWED_FIELDS = [
  'date',
  'category',
  'amount',
  'currency',
  'description',
  'receiptAvailable',
];

const STRING_FIELDS = ['date', 'category', 'currency', 'description'];

const pickAllowed = (body) => {
  const picked = {};
  for (const f of ALLOWED_FIELDS) {
    const value = body[f];
    if (value === undefined) continue;
    // Galat type (jaise object) ko "missing" maano, taaki 400 mile aur DB error na aaye
    if (STRING_FIELDS.includes(f) && typeof value !== 'string') continue;
    picked[f] = value;
  }
  return picked;
};

const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI ${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// ---- Status decision (AI ka output sirf status ko sakht kar sakta hai) ----

const decideStatus = ({
  validationPassed,
  claimCategory,
  aiAvailable,
  classification,
  questions = [],
}) => {
  if (!validationPassed) {
    return { status: CLAIM_STATUS.NEEDS_REVIEW, reason: 'One or more automatic checks failed' };
  }
  if (!aiAvailable) {
    return {
      status: CLAIM_STATUS.NEEDS_REVIEW,
      reason: 'AI review was unavailable, manual review needed',
    };
  }
  if (classification.category !== claimCategory) {
    return {
      status: CLAIM_STATUS.NEEDS_REVIEW,
      reason: `AI classified the claim as ${classification.category}, but the employee chose ${claimCategory}`,
    };
  }
  if (classification.isUncertain) {
    return { status: CLAIM_STATUS.NEEDS_REVIEW, reason: 'AI classification is uncertain' };
  }
  if (questions.length > 0) {
    return {
      status: CLAIM_STATUS.CLARIFICATION,
      reason: 'More information is needed from the employee',
    };
  }
  return {
    status: CLAIM_STATUS.COMPLIANT,
    reason: 'All checks passed and AI review found no issues',
  };
};

// ---- AI step: fail hone par poora claim nahi rukta ----

const runAI = async (input, validation, log = logger) => {
  const ai = {
    available: false,
    classification: null,
    classifiedAt: null,
    explanation: null,
    explainedAt: null,
    evidence: null,
    error: null,
    failedAt: null,
  };
  let sections = [];
  const started = Date.now();

  try {
    sections = await getRelevantSections(input.category, validation.results);
    log.info('claim_policy_retrieved', {
      category: input.category,
      sectionIds: sections.map((s) => s.sectionId),
    });

    ai.classification = await withTimeout(
      classifyClaim(input.description, { log }),
      AI_TIMEOUT_MS,
      'classification'
    );
    ai.classifiedAt = new Date();

    const out = await withTimeout(
      explainClaim({
        claim: input,
        classification: ai.classification,
        validationResults: validation.results,
        sections,
        log,
      }),
      AI_TIMEOUT_MS,
      'explanation'
    );
    ai.explanation = out;
    ai.explainedAt = new Date();

    ai.evidence = {
      policySectionId: out.policySectionId,
      policyEvidence: out.policyEvidence,
      evidenceIds: out.evidenceIds,
    };
    ai.available = true;
  } catch (error) {
    ai.error = error.message;
    ai.failedAt = new Date();
    log.warn('claim_ai_fallback', { reason: error.message, totalMs: Date.now() - started });
    // Evidence code se aata hai, isliye AI ke bina bhi mil jata hai
    if (sections.length) {
      ai.evidence = buildEvidence([], sections, validation.results);
    }
  }

  return ai;
};

const buildAiClassification = (ai) => ({
  ...(ai.classification && {
    category: ai.classification.category,
    confidence: ai.classification.confidence,
    isUncertain: ai.classification.isUncertain,
  }),
  ...(ai.explanation && {
    explanation: ai.explanation.explanation,
    questions: ai.explanation.questions,
  }),
  ...(ai.evidence && {
    policySectionId: ai.evidence.policySectionId,
    policyEvidence: ai.evidence.policyEvidence,
  }),
});

// Har entry ka apna timestamp (us step ke hone ka time)
const buildHistory = ({ validation, validatedAt, ai, status, statusReason, statusAt }) => {
  const history = [];

  const failed = validation.results.filter((r) => !r.passed);
  history.push({
    timestamp: validatedAt,
    actor: 'system',
    action: 'Validation completed',
    reason: failed.length ? failed.map((r) => r.message).join('; ') : 'All checks passed',
  });

  if (ai.classification) {
    const pct = Math.round(ai.classification.confidence * 100);
    history.push({
      timestamp: ai.classifiedAt || validatedAt,
      actor: 'ai',
      action: 'AI classified',
      to: ai.classification.category,
      reason: `Confidence ${pct}%${ai.classification.isUncertain ? ' (uncertain)' : ''}`,
    });
  }

  if (ai.evidence && ai.evidence.evidenceIds && ai.evidence.evidenceIds.length) {
    history.push({
      timestamp: ai.explainedAt || ai.failedAt || validatedAt,
      actor: 'system',
      action: 'Policy check completed',
      reason: `Policy evidence: Section ${ai.evidence.evidenceIds.join(', ')}`,
    });
  }

  if (ai.error) {
    history.push({
      timestamp: ai.failedAt || validatedAt,
      actor: 'system',
      action: 'AI unavailable',
      reason: ai.error,
    });
  }

  history.push({
    timestamp: statusAt,
    actor: 'system',
    action: 'Status set',
    to: status,
    reason: statusReason,
  });
  return history;
};

const processNewClaim = async (body, user, log = logger) => {
  const input = pickAllowed(body);
  if (typeof input.currency === 'string') {
    input.currency = input.currency.trim().toUpperCase();
  }

  // 1. Deterministic validation (claimant hamesha token wale user se)
  const validation = await validateClaimFull({ ...input, claimant: user._id });
  const validatedAt = new Date();
  const failedChecks = validation.results.filter((r) => !r.passed).map((r) => r.check);

  // Basic fields hi galat hon to save nahi karna
  if (!validation.basicPassed) {
    log.warn('claim_rejected_invalid', { failedChecks });
    const error = new Error('Invalid claim data');
    error.statusCode = 400;
    error.results = validation.results.filter((r) => !r.passed);
    throw error;
  }

  log.info('claim_validation_completed', {
    passed: validation.passed,
    failedChecks,
    category: input.category,
  });

  // 2. AI review (classification, policy retrieval, explanation)
  const ai = await runAI(input, validation, log);

  // 3. Status
  const { status, reason: statusReason } = decideStatus({
    validationPassed: validation.passed,
    claimCategory: input.category,
    aiAvailable: ai.available,
    classification: ai.classification,
    questions: ai.explanation ? ai.explanation.questions : [],
  });
  const statusAt = new Date();

  // 4. Save with history
  const claim = await Claim.create({
    ...input,
    claimant: user._id,
    status,
    finalCategory: input.category,
    validationResults: validation.results,
    aiClassification: buildAiClassification(ai),
    decisionHistory: buildHistory({
      validation,
      validatedAt,
      ai,
      status,
      statusReason,
      statusAt,
    }),
  });

  log.info('claim_saved', {
    claimId: String(claim._id),
    status,
    statusReason,
    aiAvailable: ai.available,
  });

  return claim;
};

module.exports = { processNewClaim, decideStatus, withTimeout, buildHistory };