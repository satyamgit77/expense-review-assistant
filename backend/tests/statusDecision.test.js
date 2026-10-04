const test = require('node:test');
const assert = require('node:assert');
const { decideStatus, withTimeout } = require('../services/claimProcessingService');
const { CLAIM_STATUS } = require('../config/constants');

const good = {
  validationPassed: true,
  claimCategory: 'Travel',
  aiAvailable: true,
  classification: { category: 'Travel', confidence: 0.9, isUncertain: false },
  questions: [],
};

test('everything fine -> Compliant', () => {
  assert.strictEqual(decideStatus(good).status, CLAIM_STATUS.COMPLIANT);
});

test('failed validation -> Needs Review even if AI is fine', () => {
  assert.strictEqual(
    decideStatus({ ...good, validationPassed: false }).status,
    CLAIM_STATUS.NEEDS_REVIEW
  );
});

test('failed validation stays Needs Review even with AI questions', () => {
  const res = decideStatus({ ...good, validationPassed: false, questions: ['Receipt?'] });
  assert.strictEqual(res.status, CLAIM_STATUS.NEEDS_REVIEW);
});

test('AI unavailable -> Needs Review', () => {
  const res = decideStatus({ ...good, aiAvailable: false, classification: null });
  assert.strictEqual(res.status, CLAIM_STATUS.NEEDS_REVIEW);
});

test('AI category differs from claim category -> Needs Review', () => {
  const res = decideStatus({
    ...good,
    classification: { category: 'Meals', confidence: 0.9, isUncertain: false },
  });
  assert.strictEqual(res.status, CLAIM_STATUS.NEEDS_REVIEW);
});

test('uncertain AI classification -> Needs Review', () => {
  const res = decideStatus({
    ...good,
    classification: { category: 'Travel', confidence: 0.4, isUncertain: true },
  });
  assert.strictEqual(res.status, CLAIM_STATUS.NEEDS_REVIEW);
});

test('AI questions with otherwise clean claim -> Clarification', () => {
  const res = decideStatus({ ...good, questions: ['What was the destination?'] });
  assert.strictEqual(res.status, CLAIM_STATUS.CLARIFICATION);
});

test('withTimeout resolves fast promises', async () => {
  assert.strictEqual(await withTimeout(Promise.resolve('ok'), 100, 'test'), 'ok');
});

test('withTimeout rejects slow promises', async () => {
  const slow = new Promise((resolve) => setTimeout(resolve, 500));
  await assert.rejects(() => withTimeout(slow, 20, 'test'), /timed out/);
});