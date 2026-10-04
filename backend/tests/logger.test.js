const test = require('node:test');
const assert = require('node:assert');
const { createLogger } = require('../utils/logger');

const make = (opts = {}) => {
  const lines = [];
  const log = createLogger({
    level: 'info',
    pretty: false,
    stream: { write: (l) => lines.push(l) },
    ...opts,
  });
  return { log, lines, parsed: () => lines.map((l) => JSON.parse(l)) };
};

test('JSON log has time, level, msg and fields', () => {
  const { log, parsed } = make();
  log.info('hello', { a: 1 });
  const [e] = parsed();
  assert.strictEqual(e.level, 'info');
  assert.strictEqual(e.msg, 'hello');
  assert.strictEqual(e.a, 1);
  assert.ok(!Number.isNaN(Date.parse(e.time)));
});

test('levels below the threshold are dropped', () => {
  const { log, lines } = make({ level: 'warn' });
  log.debug('d');
  log.info('i');
  log.warn('w');
  log.error('e');
  assert.strictEqual(lines.length, 2);
});

test('sensitive keys are redacted, including nested ones', () => {
  const { log, parsed } = make();
  log.info('x', {
    password: 'abc',
    token: 't',
    nested: { Authorization: 'Bearer x', apiKey: 'k', ok: 1 },
  });
  const [e] = parsed();
  assert.strictEqual(e.password, '[redacted]');
  assert.strictEqual(e.token, '[redacted]');
  assert.strictEqual(e.nested.Authorization, '[redacted]');
  assert.strictEqual(e.nested.apiKey, '[redacted]');
  assert.strictEqual(e.nested.ok, 1);
});

test('a field called "passed" is not mistaken for a password', () => {
  const { log, parsed } = make();
  log.info('x', { passed: true });
  assert.strictEqual(parsed()[0].passed, true);
});

test('Error objects are serialized with name, message and stack', () => {
  const { log, parsed } = make();
  log.error('boom', { err: new Error('bad thing') });
  const [e] = parsed();
  assert.strictEqual(e.err.name, 'Error');
  assert.strictEqual(e.err.message, 'bad thing');
  assert.strictEqual(typeof e.err.stack, 'string');
});

test('child loggers carry their bindings', () => {
  const { log, parsed } = make();
  log.child({ requestId: 'r1' }).info('hi', { a: 1 });
  const [e] = parsed();
  assert.strictEqual(e.requestId, 'r1');
  assert.strictEqual(e.a, 1);
});

test('fields cannot overwrite time, level or msg', () => {
  const { log, parsed } = make();
  log.info('real', { msg: 'fake', level: 'debug', time: 'x' });
  const [e] = parsed();
  assert.strictEqual(e.msg, 'real');
  assert.strictEqual(e.level, 'info');
  assert.notStrictEqual(e.time, 'x');
});

test('very long strings are truncated', () => {
  const { log, parsed } = make();
  log.info('x', { text: 'a'.repeat(2000) });
  assert.ok(parsed()[0].text.length <= 501);
});

test('objects with toJSON (like ObjectId) are logged as their JSON value', () => {
  const { log, parsed } = make();
  log.info('x', { id: { toJSON: () => 'abc123' } });
  assert.strictEqual(parsed()[0].id, 'abc123');
});

test('pretty format is a readable single line', () => {
  const { log, lines } = make({ pretty: true });
  log.info('hello', { a: 1, b: 'x' });
  assert.ok(lines[0].includes('INFO'));
  assert.ok(lines[0].includes('hello'));
  assert.ok(lines[0].includes('a=1'));
  assert.ok(lines[0].includes('b=x'));
});