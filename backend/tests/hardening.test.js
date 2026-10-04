const test = require('node:test');
const assert = require('node:assert');
const { fixSpacing } = require('../services/aiService');
const { validateClaim } = require('../services/validationService');

const valid = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    category: 'Travel',
    amount: 1000,
    currency: 'INR',
    description: 'Cab to client site',
    receiptAvailable: true,
  };
};

test('fixSpacing adds a space after a full stop before a capital letter', () => {
  assert.strictEqual(fixSpacing('Checks passed (Section 2.1).However it lacks'), 'Checks passed (Section 2.1). However it lacks');
});

test('fixSpacing adds a space before a bracket glued to a number', () => {
  assert.strictEqual(fixSpacing('limit of ₹5,000(Section 2.1)'), 'limit of ₹5,000 (Section 2.1)');
});

test('fixSpacing leaves section numbers and decimals alone', () => {
  assert.strictEqual(fixSpacing('See Section 3.2 and amount 1.5 done.'), 'See Section 3.2 and amount 1.5 done.');
});

test('invalid date string stops at the basic checks', () => {
  const res = validateClaim({ ...valid(), date: 'not-a-date' });
  assert.strictEqual(res.basicPassed, false);
  assert.ok(res.results.some((r) => r.check === 'date' && !r.passed));
});

test('a valid date still passes the basic checks', () => {
  assert.strictEqual(validateClaim(valid()).basicPassed, true);
});