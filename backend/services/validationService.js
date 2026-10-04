const Claim = require('../models/Claim');
const { CATEGORIES, CLAIM_STATUS } = require('../config/constants');
const { getConfig } = require('./policyService');
const { isValidDate, daysBetween, startOfDay } = require('../utils/dateUtils');

const result = (check, passed, message, sectionId) => ({
  check,
  passed,
  message,
  sectionId,
});

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const isMissing = (v) => v === undefined || v === null || v === '';

// ---- Basic checks (inke fail hone par baaki checks ka matlab nahi) ----

const checkRequiredFields = (claim) => {
  const missing = ['date', 'category', 'amount', 'currency', 'description'].filter((f) =>
    isMissing(claim[f])
  );
  if (typeof claim.receiptAvailable !== 'boolean') missing.push('receiptAvailable');

  return missing.length
    ? result('requiredFields', false, `Missing required fields: ${missing.join(', ')}`)
    : result('requiredFields', true, 'All required fields are present');
};

const checkAmount = (claim) => {
  const amount = Number(claim.amount);
  return Number.isFinite(amount) && amount > 0
    ? result('amount', true, 'Amount is valid')
    : result('amount', false, 'Amount must be a number greater than 0');
};

const checkCategory = (claim) =>
  CATEGORIES.includes(claim.category)
    ? result('category', true, `Category "${claim.category}" is valid`)
    : result('category', false, `Unknown category "${claim.category}"`);

// ---- Policy checks ----

const checkDate = (claim, config) => {
  if (!isValidDate(claim.date)) {
    return result('date', false, 'Date is not valid');
  }

  const age = daysBetween(claim.date, new Date());

  if (age < 0 && !config.allowFutureDates) {
    return result('date', false, 'Claim date is in the future', '1.1');
  }
  if (age > config.submissionWindowDays) {
    return result(
      'date',
      false,
      `Claim is ${age} days old; must be submitted within ${config.submissionWindowDays} days`,
      '1.1'
    );
  }
  return result('date', true, 'Claim date is within the submission window', '1.1');
};

const checkCurrency = (claim, config) =>
  String(claim.currency).toUpperCase() === config.currency
    ? result('currency', true, `Currency is ${config.currency}`, '1.3')
    : result(
        'currency',
        false,
        `Currency is ${claim.currency}; policy limits are in ${config.currency}`,
        '1.3'
      );

const checkReceipt = (claim, config) => {
  const { requiredAbove, sectionId } = config.receipt;
  const amount = Number(claim.amount);

  if (amount > requiredAbove && !claim.receiptAvailable) {
    return result(
      'receipt',
      false,
      `Receipt is required for amounts above ${inr(requiredAbove)}`,
      sectionId
    );
  }
  return result('receipt', true, 'Receipt requirement satisfied', sectionId);
};

const checkLimit = (claim, config) => {
  const catConfig = config.categories[claim.category];
  const amount = Number(claim.amount);

  return amount > catConfig.limit
    ? result(
        'limit',
        false,
        `Amount ${inr(amount)} exceeds the ${claim.category} limit of ${inr(catConfig.limit)}`,
        catConfig.limitSectionId
      )
    : result(
        'limit',
        true,
        `Amount ${inr(amount)} is within the ${claim.category} limit of ${inr(catConfig.limit)}`,
        catConfig.limitSectionId
      );
};

// ---- Main ----

const validateClaim = (claim, config = getConfig()) => {
  const basic = [checkRequiredFields(claim)];

  // Pehle required fields; wo na ho to aage kuch check nahi ho sakta
    if (basic[0].passed) {
    basic.push(checkAmount(claim), checkCategory(claim));
    // Kharab date ko save hone se pehle hi rok do (warna DB cast error se 500 aata)
    if (!isValidDate(claim.date)) {
      basic.push(result('date', false, 'Date is not valid'));
    }
  }

//   if (basic.some((r) => !r.passed)) {
//     return { passed: false, results: basic };
//   }

  if (basic.some((r) => !r.passed)) {
    return { passed: false, basicPassed: false, results: basic };
  }

  const results = [
    ...basic,
    checkDate(claim, config),
    checkCurrency(claim, config),
    checkReceipt(claim, config),
  ];

  // Limit sirf INR claims par compare hoti hai
  if (results.find((r) => r.check === 'currency').passed) {
    results.push(checkLimit(claim, config));
  }

    return { passed: results.every((r) => r.passed), basicPassed: true, results };
};

// ---- Duplicate check (DB) ----

const buildDuplicateQuery = (claim, config, excludeId) => {
  const query = { status: { $ne: CLAIM_STATUS.REJECTED } };

  for (const field of config.duplicateCheckFields) {
    if (field === 'date') {
      const start = startOfDay(claim.date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end }; // poora din
    } else if (field === 'amount') {
      query.amount = Number(claim.amount);
    } else {
      query[field] = claim[field];
    }
  }

  if (excludeId) query._id = { $ne: excludeId };
  return query;
};

const checkDuplicate = async (claim, config = getConfig(), excludeId) => {
  if (!claim.claimant) {
    throw new Error('claimant is required for the duplicate check');
  }

  const existing = await Claim.findOne(buildDuplicateQuery(claim, config, excludeId)).select(
    '_id'
  );

  return existing
    ? result('duplicate', false, `Likely duplicate of an existing claim (ID: ${existing._id})`)
    : result('duplicate', true, 'No duplicate claim found');
};

// Sab checks: sync wale + duplicate
const validateClaimFull = async (claim, options = {}) => {
  const config = getConfig();
  const base = validateClaim(claim, config);

  // Basic fields hi galat hon to duplicate check ka matlab nahi
  if (!base.basicPassed) return base;

  const results = [...base.results, await checkDuplicate(claim, config, options.excludeId)];
  return { passed: results.every((r) => r.passed), basicPassed: true, results };
};

module.exports = {
  validateClaim,
  validateClaimFull,
  checkDuplicate,
  buildDuplicateQuery,
  checkLimit,
};