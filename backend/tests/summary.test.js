const test = require('node:test');
const assert = require('node:assert');
const { buildSummary } = require('../services/summaryService');

const claim = (over = {}) => ({
  amount: 100,
  currency: 'INR',
  category: 'Travel',
  status: 'Needs Review',
  ...over,
});

test('empty list gives zero count and no currencies', () => {
  const s = buildSummary([]);
  assert.strictEqual(s.count, 0);
  assert.deepStrictEqual(s.byCurrency, {});
});

test('currencies are never mixed', () => {
  const s = buildSummary([claim({ amount: 1000 }), claim({ amount: 50, currency: 'USD' })]);
  assert.strictEqual(s.byCurrency.INR.total, 1000);
  assert.strictEqual(s.byCurrency.USD.total, 50);
});

test('totals avoid floating point errors', () => {
  const s = buildSummary([claim({ amount: 0.1 }), claim({ amount: 0.2 })]);
  assert.strictEqual(s.byCurrency.INR.total, 0.3);
});

test('category totals use the reviewer-overridden category', () => {
  const s = buildSummary([
    claim({ amount: 2400, category: 'Meals', finalCategory: 'Client Entertainment' }),
    claim({ amount: 500, category: 'Meals' }),
  ]);
  assert.deepStrictEqual(s.byCurrency.INR.byCategory, {
    'Client Entertainment': 2400,
    Meals: 500,
  });
});

test('approved, rejected and open amounts are split by status', () => {
  const s = buildSummary([
    claim({ amount: 1000, status: 'Approved' }),
    claim({ amount: 200, status: 'Rejected' }),
    claim({ amount: 300, status: 'Needs Review' }),
    claim({ amount: 400, status: 'Clarification' }),
    claim({ amount: 50, status: 'Compliant' }),
  ]);
  const inr = s.byCurrency.INR;
  assert.strictEqual(inr.total, 1950);
  assert.strictEqual(inr.approved, 1000);
  assert.strictEqual(inr.rejected, 200);
  assert.strictEqual(inr.open, 750);
});

test('status counts are returned', () => {
  const s = buildSummary([
    claim({ status: 'Approved' }),
    claim({ status: 'Approved' }),
    claim({ status: 'Rejected' }),
  ]);
  assert.deepStrictEqual(s.statusCounts, { Approved: 2, Rejected: 1 });
});