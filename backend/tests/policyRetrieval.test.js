const test = require('node:test');
const assert = require('node:assert');
const { selectSectionRefs, formatEvidence } = require('../services/policyService');

const ids = (refs) => refs.map((r) => r.sectionId);

test('category with no failures returns limit and details sections', () => {
  assert.deepStrictEqual(ids(selectSectionRefs('Travel', [])), ['2.1', '2.2']);
});

test('duplicate section ids are merged (Accommodation)', () => {
  const refs = selectSectionRefs('Accommodation', []);
  assert.deepStrictEqual(ids(refs), ['4.1']);
  assert.deepStrictEqual(refs[0].reasons, ['limit', 'details']);
});

test('failed checks add their policy sections', () => {
  const results = [{ check: 'receipt', passed: false, sectionId: '1.2' }];
  assert.deepStrictEqual(ids(selectSectionRefs('Meals', results)), ['1.2', '3.1', '3.2']);
});

test('passed checks are not added', () => {
  const results = [
    { check: 'date', passed: true, sectionId: '1.1' },
    { check: 'receipt', passed: false, sectionId: '1.2' },
  ];
  const got = ids(selectSectionRefs('Travel', results));
  assert.ok(!got.includes('1.1'));
  assert.ok(got.includes('1.2'));
});

test('failed limit check merges into the limit section reasons', () => {
  const results = [{ check: 'limit', passed: false, sectionId: '3.2' }];
  const refs = selectSectionRefs('Meals', results);
  const limit = refs.find((r) => r.sectionId === '3.2');
  assert.deepStrictEqual(limit.reasons, ['limit', 'limit check failed']);
});

test('unknown category still returns sections of failed checks', () => {
  const results = [{ check: 'date', passed: false, sectionId: '1.1' }];
  assert.deepStrictEqual(ids(selectSectionRefs('Gifts', results)), ['1.1']);
});

test('results are sorted by section number', () => {
  const results = [{ check: 'currency', passed: false, sectionId: '1.3' }];
  assert.deepStrictEqual(ids(selectSectionRefs('Client Entertainment', results)), [
    '1.3',
    '6.1',
    '6.2',
  ]);
});

test('formatEvidence builds a citation string', () => {
  const text = formatEvidence({
    category: 'Meals',
    sectionId: '3.2',
    text: 'Meal expenses are limited to ₹1,500 per claim.',
  });
  assert.strictEqual(
    text,
    'Meals Policy, Section 3.2 - Meal expenses are limited to ₹1,500 per claim.'
  );
});