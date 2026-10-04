const { CLAIM_STATUS, CATEGORIES } = require('../config/constants');
const { checkLimit } = require('./validationService');
const { getConfig } = require('./policyService');

const FINAL_STATUSES = [CLAIM_STATUS.APPROVED, CLAIM_STATUS.REJECTED];
const MAX_REASON_CHARS = 500;

const cleanReason = (reason) => String(reason ?? '').trim().slice(0, MAX_REASON_CHARS);

// Allowed ho to null, warna { statusCode, message }
const checkDecision = ({ action, claim, reviewerId, reason }) => {
  if (String(claim.claimant) === String(reviewerId)) {
    return { statusCode: 403, message: 'You cannot review your own claim' };
  }

  if (FINAL_STATUSES.includes(claim.status)) {
    return { statusCode: 409, message: `Claim is already ${claim.status}` };
  }

  const failed = (claim.validationResults || []).filter((r) => !r.passed);

  if (action === 'Approve') {
    if (failed.some((r) => r.check === 'receipt')) {
      return {
        statusCode: 409,
        message: 'Cannot approve: a receipt is required for this amount (Section 1.2)',
      };
    }
    if (failed.length > 0 && !reason) {
      return {
        statusCode: 400,
        message: 'A reason is required to approve a claim with failed checks',
      };
    }
  }

  if (action === 'Reject' && !reason) {
    return { statusCode: 400, message: 'A reason is required to reject a claim' };
  }

  return null;
};

// Clarification request ke rules
const checkClarificationRequest = ({ claim, reviewerId, message }) => {
  if (String(claim.claimant) === String(reviewerId)) {
    return { statusCode: 403, message: 'You cannot review your own claim' };
  }
  if (FINAL_STATUSES.includes(claim.status)) {
    return { statusCode: 409, message: `Claim is already ${claim.status}` };
  }
  if (!message) {
    return { statusCode: 400, message: 'A message is required to request clarification' };
  }
  return null;
};

// Category override ke rules
const checkOverride = ({ claim, reviewerId, newCategory, reason }) => {
  if (String(claim.claimant) === String(reviewerId)) {
    return { statusCode: 403, message: 'You cannot review your own claim' };
  }
  if (FINAL_STATUSES.includes(claim.status)) {
    return { statusCode: 409, message: `Claim is already ${claim.status}` };
  }
  if (!CATEGORIES.includes(newCategory)) {
    return { statusCode: 400, message: `Invalid category. Allowed: ${CATEGORIES.join(', ')}` };
  }
  const current = claim.finalCategory || claim.category;
  if (newCategory === current) {
    return { statusCode: 400, message: `Claim is already in the ${current} category` };
  }
  if (!reason) {
    return { statusCode: 400, message: 'A reason is required to override the classification' };
  }
  return null;
};

const plain = (r) => (r && typeof r.toObject === 'function' ? r.toObject() : r);

// Override ke baad: sirf limit check nayi category ke hisaab se dobara
const recalcAfterOverride = ({ claim, newCategory, config = getConfig() }) => {
  const old = (claim.validationResults || []).map(plain);
  const hasLimit = old.some((r) => r.check === 'limit');

  // Limit check tabhi tha jab currency INR thi; agar nahi tha to naya mat jodo
  const limitResult = hasLimit
    ? checkLimit({ category: newCategory, amount: claim.amount }, config)
    : null;

  const validationResults = hasLimit
    ? old.map((r) => (r.check === 'limit' ? limitResult : r))
    : old;

  // Compliant claim me ab koi check fail ho to Needs Review; baaki status wahi
  const anyFailed = validationResults.some((r) => !r.passed);
  const status =
    claim.status === CLAIM_STATUS.COMPLIANT && anyFailed
      ? CLAIM_STATUS.NEEDS_REVIEW
      : claim.status;

  return { validationResults, status, limitResult };
};

module.exports = {
  checkDecision,
  checkClarificationRequest,
  checkOverride,
  recalcAfterOverride,
  cleanReason,
  FINAL_STATUSES,
};