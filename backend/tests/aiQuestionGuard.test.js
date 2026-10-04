const test = require('node:test');
const assert = require('node:assert');
const { shouldAllowQuestions, normalizeExplanation } = require('../services/aiService');

const noFailures = [{ check: 'limit', passed: true }];
const receiptFailed = [{ check: 'receipt', passed: false }];
const sections = [{ sectionId: '2.2' }];

test('questions allowed for Travel (policy asks for details)', () => {
  assert.strictEqual(shouldAllowQuestions('Travel', noFailures), true);
});

test('questions allowed for Client Entertainment', () => {
  assert.strictEqual(shouldAllowQuestions('Client Entertainment', noFailures), true);
});

test('questions not allowed for Meals when nothing failed', () => {
  assert.strictEqual(shouldAllowQuestions('Meals', noFailures), false);
});

test('questions allowed for Meals when the receipt check failed', () => {
  assert.strictEqual(shouldAllowQuestions('Meals', receiptFailed), true);
});

test('questions not allowed for an unknown category', () => {
  assert.strictEqual(shouldAllowQuestions('Gifts', noFailures), false);
});

test('normalizeExplanation drops questions when not allowed', () => {
  const res = normalizeExplanation(
    { explanation: 'x', citedSectionIds: [], questions: ['Who attended?'] },
    sections,
    { allowQuestions: false }
  );
  assert.deepStrictEqual(res.questions, []);
});

test('normalizeExplanation keeps questions by default', () => {
  const res = normalizeExplanation(
    { explanation: 'x', citedSectionIds: [], questions: ['What was the destination?'] },
    sections
  );
  assert.deepStrictEqual(res.questions, ['What was the destination?']);
});