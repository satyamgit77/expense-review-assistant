const test = require('node:test');
const assert = require('node:assert');
const { sumAmounts, totalsByCategory } = require('../utils/currencyUtils');
const { buildDuplicateQuery } = require('../services/validationService');
const { getConfig } = require('../services/policyService');

test('sumAmounts avoids floating point errors', () => {
  assert.strictEqual(sumAmounts([0.1, 0.2]), 0.3);
  assert.strictEqual(sumAmounts([10.1, 20.2]), 30.3);
});

test('sumAmounts throws on invalid amount', () => {
  assert.throws(() => sumAmounts([100, 'abc']));
});

test('totalsByCategory gives grand and category totals', () => {
  const res = totalsByCategory([
    { category: 'Travel', amount: 2500 },
    { category: 'Travel', amount: 1000.5 },
    { category: 'Meals', amount: 800 },
  ]);
  assert.strictEqual(res.count, 3);
  assert.strictEqual(res.total, 4300.5);
  assert.deepStrictEqual(res.byCategory, { Travel: 3500.5, Meals: 800 });
});

test('totalsByCategory handles an empty list', () => {
  const res = totalsByCategory([]);
  assert.strictEqual(res.total, 0);
  assert.deepStrictEqual(res.byCategory, {});
});

test('duplicate query uses configured fields and ignores rejected claims', () => {
  const claim = {
    claimant: 'user1',
    date: '2026-10-03',
    category: 'Travel',
    amount: '2500',
  };
  const q = buildDuplicateQuery(claim, getConfig());

  assert.strictEqual(q.claimant, 'user1');
  assert.strictEqual(q.category, 'Travel');
  assert.strictEqual(q.amount, 2500);
  assert.deepStrictEqual(q.status, { $ne: 'Rejected' });
  assert.ok(q.date.$gte instanceof Date && q.date.$lt instanceof Date);
  assert.strictEqual(q.date.$lt - q.date.$gte, 24 * 60 * 60 * 1000);
});

test('duplicate query can exclude the claim being re-checked', () => {
  const q = buildDuplicateQuery(
    { claimant: 'u', date: '2026-10-03', category: 'Meals', amount: 100 },
    getConfig(),
    'abc123'
  );
  assert.deepStrictEqual(q._id, { $ne: 'abc123' });
});