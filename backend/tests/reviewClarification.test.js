const test = require('node:test');
const assert = require('node:assert');
const { checkClarificationRequest } = require('../services/reviewService');

const claim = (over = {}) => ({ claimant: 'emp1', status: 'Needs Review', ...over });

test('clarification needs a message', () => {
  const res = checkClarificationRequest({ claim: claim(), reviewerId: 'rev1', message: '' });
  assert.strictEqual(res.statusCode, 400);
});

test('reviewer cannot request clarification on own claim', () => {
  const res = checkClarificationRequest({ claim: claim(), reviewerId: 'emp1', message: 'Why?' });
  assert.strictEqual(res.statusCode, 403);
});

test('cannot request clarification on an approved claim', () => {
  const res = checkClarificationRequest({
    claim: claim({ status: 'Approved' }),
    reviewerId: 'rev1',
    message: 'Why?',
  });
  assert.strictEqual(res.statusCode, 409);
});

test('cannot request clarification on a rejected claim', () => {
  const res = checkClarificationRequest({
    claim: claim({ status: 'Rejected' }),
    reviewerId: 'rev1',
    message: 'Why?',
  });
  assert.strictEqual(res.statusCode, 409);
});

test('valid clarification request is allowed', () => {
  const res = checkClarificationRequest({
    claim: claim(),
    reviewerId: 'rev1',
    message: 'Who attended the lunch?',
  });
  assert.strictEqual(res, null);
});

test('clarification is allowed again on a claim already in Clarification', () => {
  const res = checkClarificationRequest({
    claim: claim({ status: 'Clarification' }),
    reviewerId: 'rev1',
    message: 'One more question',
  });
  assert.strictEqual(res, null);
});