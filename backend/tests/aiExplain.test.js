const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeExplanation,
  pickPrimarySection,
  buildEvidence,
} = require('../services/aiService');

const sec = (sectionId, category, text, reasons = []) => ({
  sectionId,
  category,
  title: 't',
  text,
  reasons,
});

const meals = [
  sec('1.2', 'General Rules', 'Receipt required above 500.', ['receipt check failed']),
  sec('3.1', 'Meals', 'Employee meals are reimbursable.', ['details']),
  sec('3.2', 'Meals', 'Meal limit is 1500.', ['limit', 'limit check failed']),
];

test('normalizeExplanation accepts valid output', () => {
  const res = normalizeExplanation(
    { explanation: 'Exceeds limit (Section 3.2).', citedSectionIds: ['3.2'], questions: ['Who attended?'] },
    meals
  );
  assert.deepStrictEqual(res.citedSectionIds, ['3.2']);
  assert.deepStrictEqual(res.questions, ['Who attended?']);
});

test('normalizeExplanation drops cited ids that were not provided', () => {
  const res = normalizeExplanation(
    { explanation: 'x', citedSectionIds: ['3.2', '9.9'], questions: [] },
    meals
  );
  assert.deepStrictEqual(res.citedSectionIds, ['3.2']);
});

test('normalizeExplanation throws on empty explanation', () => {
  assert.throws(() => normalizeExplanation({ explanation: '  ', citedSectionIds: [] }, meals));
});

test('normalizeExplanation limits questions to 3 and removes blanks', () => {
  const res = normalizeExplanation(
    { explanation: 'x', citedSectionIds: [], questions: ['a', '', 'b', 'c', 'd'] },
    meals
  );
  assert.deepStrictEqual(res.questions, ['a', 'b', 'c']);
});

test('normalizeExplanation handles missing arrays', () => {
  const res = normalizeExplanation({ explanation: 'x' }, meals);
  assert.deepStrictEqual(res.citedSectionIds, []);
  assert.deepStrictEqual(res.questions, []);
});

test('pickPrimarySection prefers the failed limit section', () => {
  const results = [
    { check: 'receipt', passed: false, sectionId: '1.2' },
    { check: 'limit', passed: false, sectionId: '3.2' },
  ];
  assert.strictEqual(pickPrimarySection(meals, results).sectionId, '3.2');
});

test('pickPrimarySection uses receipt when limit passed', () => {
  const results = [
    { check: 'limit', passed: true, sectionId: '3.2' },
    { check: 'receipt', passed: false, sectionId: '1.2' },
  ];
  assert.strictEqual(pickPrimarySection(meals, results).sectionId, '1.2');
});

test('pickPrimarySection falls back to the limit section when all passed', () => {
  const results = [{ check: 'limit', passed: true, sectionId: '3.2' }];
  assert.strictEqual(pickPrimarySection(meals, results).sectionId, '3.2');
});

test('buildEvidence puts the primary section first and adds verified citations', () => {
  const results = [{ check: 'limit', passed: false, sectionId: '3.2' }];
  const ev = buildEvidence(['1.2'], meals, results);
  assert.strictEqual(ev.policySectionId, '3.2');
  assert.deepStrictEqual(ev.evidenceIds, ['3.2', '1.2']);
  assert.ok(ev.policyEvidence.startsWith('Meals Policy, Section 3.2'));
});

test('buildEvidence falls back to the primary section when nothing is cited', () => {
  const results = [{ check: 'limit', passed: false, sectionId: '3.2' }];
  const ev = buildEvidence([], meals, results);
  assert.deepStrictEqual(ev.evidenceIds, ['3.2']);
});

test('buildEvidence handles no sections', () => {
  const ev = buildEvidence([], [], []);
  assert.strictEqual(ev.policySectionId, undefined);
  assert.strictEqual(ev.policyEvidence, '');
});