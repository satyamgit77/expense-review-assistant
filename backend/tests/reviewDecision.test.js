const test = require('node:test');
const assert = require('node:assert');
const { checkDecision, cleanReason } = require('../services/reviewService');

const claim = (over = {}) => ({
  claimant: 'emp1',
  status: 'Needs Review',
  validationResults: [{ check: 'limit', passed: false }],
  ...over,
});

const ok = { passed: true };

test('reviewer cannot review their own claim', () => {
  const res = checkDecision({ action: 'Reject', claim: claim(), reviewerId: 'emp1', reason: 'x' });
  assert.strictEqual(res.statusCode, 403);
});

test('already approved claim cannot be decided again', () => {
  const res = checkDecision({
    action: 'Reject',
    claim: claim({ status: 'Approved' }),
    reviewerId: 'rev1',
    reason: 'x',
  });
  assert.strictEqual(res.statusCode, 409);
});

test('already rejected claim cannot be approved', () => {
  const res = checkDecision({
    action: 'Approve',
    claim: claim({ status: 'Rejected', validationResults: [] }),
    reviewerId: 'rev1',
    reason: '',
  });
  assert.strictEqual(res.statusCode, 409);
});

test('reject needs a reason', () => {
  const res = checkDecision({ action: 'Reject', claim: claim(), reviewerId: 'rev1', reason: '' });
  assert.strictEqual(res.statusCode, 400);
});

test('reject with a reason is allowed', () => {
  const res = checkDecision({
    action: 'Reject',
    claim: claim(),
    reviewerId: 'rev1',
    reason: 'Exceeds limit',
  });
  assert.strictEqual(res, null);
});

test('approve is blocked when the receipt check failed', () => {
  const res = checkDecision({
    action: 'Approve',
    claim: claim({ validationResults: [{ check: 'receipt', passed: false }] }),
    reviewerId: 'rev1',
    reason: 'ok',
  });
  assert.strictEqual(res.statusCode, 409);
});

test('approve with a failed check needs a reason', () => {
  const res = checkDecision({ action: 'Approve', claim: claim(), reviewerId: 'rev1', reason: '' });
  assert.strictEqual(res.statusCode, 400);
});

test('approve with a failed check and a reason is allowed', () => {
  const res = checkDecision({
    action: 'Approve',
    claim: claim(),
    reviewerId: 'rev1',
    reason: 'Client dinner approved by manager',
  });
  assert.strictEqual(res, null);
});

test('approve of a clean claim needs no reason', () => {
  const res = checkDecision({
    action: 'Approve',
    claim: claim({ status: 'Compliant', validationResults: [ok] }),
    reviewerId: 'rev1',
    reason: '',
  });
  assert.strictEqual(res, null);
});

test('cleanReason trims, handles null and truncates', () => {
  assert.strictEqual(cleanReason('  hi  '), 'hi');
  assert.strictEqual(cleanReason(null), '');
  assert.strictEqual(cleanReason('x'.repeat(900)).length, 500);
});