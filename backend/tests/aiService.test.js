const test = require('node:test');
const assert = require('node:assert');
const { parseJSON, normalizeClassification } = require('../services/aiService');

test('parseJSON reads plain JSON', () => {
  assert.deepStrictEqual(parseJSON('{"a":1}'), { a: 1 });
});

test('parseJSON strips code fences', () => {
  assert.deepStrictEqual(parseJSON('```json\n{"a":1}\n```'), { a: 1 });
});

test('parseJSON finds JSON inside extra text', () => {
  assert.deepStrictEqual(parseJSON('Here you go: {"a":1} done'), { a: 1 });
});

test('parseJSON throws on garbage', () => {
  assert.throws(() => parseJSON('no json here'));
});

test('normalize accepts a valid classification', () => {
  const res = normalizeClassification(
    { category: 'meals', confidence: 0.9, reason: 'Lunch' },
    0.75
  );
  assert.strictEqual(res.category, 'Meals');
  assert.strictEqual(res.isUncertain, false);
});

test('normalize rejects an unknown category', () => {
  assert.throws(() => normalizeClassification({ category: 'Gifts', confidence: 0.9 }, 0.75));
});

test('normalize rejects a non-numeric confidence', () => {
  assert.throws(() =>
    normalizeClassification({ category: 'Travel', confidence: 'high' }, 0.75)
  );
});

test('normalize converts percentage confidence', () => {
  const res = normalizeClassification({ category: 'Travel', confidence: 94 }, 0.75);
  assert.strictEqual(res.confidence, 0.94);
});

test('normalize flags low confidence as uncertain', () => {
  const res = normalizeClassification({ category: 'Travel', confidence: 0.4 }, 0.75);
  assert.strictEqual(res.isUncertain, true);
});