const test = require('node:test');
const assert = require('node:assert');
const { validateClaim } = require('../services/validationService');

// Aaj se n din pehle ki date, 'YYYY-MM-DD' me
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const base = () => ({
  date: daysAgo(1),
  category: 'Travel',
  amount: 2500,
  currency: 'INR',
  description: 'Cab used for client meeting',
  receiptAvailable: true,
});

const find = (res, name) => res.results.find((r) => r.check === name);

test('valid claim passes all checks', () => {
  const res = validateClaim(base());
  assert.strictEqual(res.passed, true);
});

test('missing field fails requiredFields', () => {
  const claim = base();
  delete claim.description;
  const res = validateClaim(claim);
  assert.strictEqual(res.passed, false);
  assert.strictEqual(find(res, 'requiredFields').passed, false);
});

test('unknown category fails', () => {
  const res = validateClaim({ ...base(), category: 'Gifts' });
  assert.strictEqual(find(res, 'category').passed, false);
});

test('future date fails', () => {
  const res = validateClaim({ ...base(), date: daysAgo(-3) });
  assert.strictEqual(find(res, 'date').passed, false);
});

test('claim older than 30 days fails', () => {
  const res = validateClaim({ ...base(), date: daysAgo(45) });
  assert.strictEqual(find(res, 'date').passed, false);
});

test('missing receipt above 500 fails', () => {
  const res = validateClaim({ ...base(), receiptAvailable: false });
  assert.strictEqual(find(res, 'receipt').passed, false);
});

test('missing receipt at 500 or below passes', () => {
  const res = validateClaim({ ...base(), amount: 500, receiptAvailable: false });
  assert.strictEqual(find(res, 'receipt').passed, true);
});

test('amount above category limit fails', () => {
  const res = validateClaim({ ...base(), category: 'Meals', amount: 2000 });
  const limit = find(res, 'limit');
  assert.strictEqual(limit.passed, false);
  assert.strictEqual(limit.sectionId, '3.2');
});

test('amount equal to limit passes', () => {
  const res = validateClaim({ ...base(), category: 'Meals', amount: 1500 });
  assert.strictEqual(find(res, 'limit').passed, true);
});

test('non-INR currency fails currency check and skips limit', () => {
  const res = validateClaim({ ...base(), currency: 'USD' });
  assert.strictEqual(find(res, 'currency').passed, false);
  assert.strictEqual(find(res, 'limit'), undefined);
});