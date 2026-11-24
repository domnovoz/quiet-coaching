import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, normalizeUsername, validateNewAccount } from '../src/auth.js';
import { parseResult, validateExcerpt, UserError } from '../src/insights.js';
import { hasRestrictedData } from '../src/restricted.js';
import { signInPage } from '../src/pages.js';

test('password hashing is salted and repeatable', async () => {
  const a = await hashPassword('correct horse battery');
  const b = await hashPassword('correct horse battery', a.salt);
  const c = await hashPassword('correct horse battery');
  assert.equal(a.hash, b.hash);
  assert.notEqual(a.hash, c.hash);
});

test('account validation', () => {
  assert.equal(normalizeUsername('  Dom.N '), 'dom.n');
  assert.equal(validateNewAccount('dom', 'long enough pw'), null);
  assert.match(validateNewAccount('d', 'long enough pw'), /username/);
  assert.match(validateNewAccount('dom', 'short'), /password/);
});

test('excerpt requires consent and blocks restricted data', () => {
  assert.throws(() => validateExcerpt('hello', false), UserError);
  assert.throws(() => validateExcerpt('   ', true), UserError);
  assert.throws(() => validateExcerpt('x'.repeat(4001), true), UserError);
  assert.throws(() => validateExcerpt('password: hunter2hunter2', true), UserError);
  assert.equal(validateExcerpt('  I keep postponing the first step. ', true), 'I keep postponing the first step.');
  assert.equal(hasRestrictedData('card 4242 4242 4242 4242'), true);
  assert.equal(hasRestrictedData('I said yes to 3 projects in 2026'), false);
});

test('model output parsing', () => {
  const r = parseResult({ response: 'Sure: {"patterns":[{"pattern":"Delay","evidence":"I keep putting off","interpretation":"maybe"}],"question":"What would a first step be?"}' });
  assert.equal(r.patterns.length, 1);
  assert.equal(r.question, 'What would a first step be?');
  const obj = parseResult({ response: { patterns: [], question: 'What matters?' } });
  assert.equal(obj.question, 'What matters?');
  const plain = parseResult({ response: 'A plain answer.' });
  assert.equal(plain.summary, 'A plain answer.');
  assert.throws(() => parseResult({ response: '' }));
});

test('sign-in page escapes input', () => {
  const page = signInPage({ clientName: '<script>x</script>', redirectHost: 'chatgpt.com', handle: 'h' });
  assert.ok(!page.includes('<script>x'));
});
