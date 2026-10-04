const test = require('node:test');
const assert = require('node:assert');
const { checkOverride, recalcAfterOverride } = require('../services/reviewService');

const claim = (over = {}) => ({
  claimant: 'emp1',
  status: 'Needs Review',
  category: 'Meals',
  finalCategory: 'Meals',
  amount: 2000,
  validationResults: [
    { check: 'receipt', passed: true, sectionId: '1.2' },
    { check: 'limit', passed: false, sectionId: '3.2' },
  ],
  ...over,
});

const base = { reviewerId: 'rev1', newCategory: 'Client Entertainment', reason: 'Client dinner' };

test('override on own claim is blocked', () => {
  assert.strictEqual(checkOverride({ claim: claim(), ...base, reviewerId: 'emp1' }).statusCode, 403);
});

test('override on a final claim is blocked', () => {
  assert.strictEqual(
    checkOverride({ claim: claim({ status: 'Approved' }), ...base }).statusCode,
    409
  );
});

test('override with an unknown category is rejected', () => {
  assert.strictEqual(checkOverride({ claim: claim(), ...base, newCategory: 'Gifts' }).statusCode, 400);
});

test('override to the same category is rejected', () => {
  assert.strictEqual(checkOverride({ claim: claim(), ...base, newCategory: 'Meals' }).statusCode, 400);
});

test('override without a reason is rejected', () => {
  assert.strictEqual(checkOverride({ claim: claim(), ...base, reason: '' }).statusCode, 400);
});

test('valid override is allowed', () => {
  assert.strictEqual(checkOverride({ claim: claim(), ...base }), null);
});

test('recalc: limit passes under the new category and other checks stay', () => {
  const res = recalcAfterOverride({ claim: claim(), newCategory: 'Client Entertainment' });
  const limit = res.validationResults.find((r) => r.check === 'limit');
  assert.strictEqual(limit.passed, true);
  assert.strictEqual(limit.sectionId, '6.1');
  assert.ok(res.validationResults.find((r) => r.check === 'receipt').passed);
  assert.strictEqual(res.status, 'Needs Review'); // status badalta nahi
});

test('recalc: Compliant claim fails the new limit -> Needs Review', () => {
  const c = claim({
    status: 'Compliant',
    category: 'Travel',
    finalCategory: 'Travel',
    amount: 4500,
    validationResults: [{ check: 'limit', passed: true, sectionId: '2.1' }],
  });
  const res = recalcAfterOverride({ claim: c, newCategory: 'Meals' });
  assert.strictEqual(res.validationResults[0].passed, false);
  assert.strictEqual(res.status, 'Needs Review');
});

test('recalc: Compliant claim stays Compliant when the new limit also passes', () => {
  const c = claim({
    status: 'Compliant',
    amount: 1000,
    validationResults: [{ check: 'limit', passed: true, sectionId: '3.2' }],
  });
  assert.strictEqual(recalcAfterOverride({ claim: c, newCategory: 'Travel' }).status, 'Compliant');
});

test('recalc: no limit check (non-INR claim) means none is added', () => {
  const c = claim({ validationResults: [{ check: 'currency', passed: false, sectionId: '1.3' }] });
  const res = recalcAfterOverride({ claim: c, newCategory: 'Client Entertainment' });
  assert.strictEqual(res.validationResults.length, 1);
  assert.strictEqual(res.limitResult, null);
});