// Creates or resets the dedicated app-review account with sample insights.
// Usage: node scripts/reviewer.mjs <username> <password>  (prints SQL to stdout; pipe into wrangler d1 execute)
import { hashPassword } from '../src/auth.js';

const [username, password] = process.argv.slice(2);
if (!username || !password) throw new Error('username and password required');
const { hash, salt } = await hashPassword(password);
const id = 'reviewer-' + username;
const now = Date.now();
const day = 86400000;
const samples = [
  { patterns: [
      { pattern: 'You agree to extra work even when your week is already full', evidence: 'I keep saying yes to extra work', interpretation: 'It may be that being the dependable one protects your sense of belonging on the team, while costing you time you need for your own priorities.' },
      { pattern: 'You already negotiate well in other settings', evidence: 'I have negotiated successfully with clients', interpretation: 'It may be that the skill is there, and what feels different is the relationship with your manager.' }
    ], question: 'What feels different about saying no to your manager than to a client?' },
  { patterns: [
      { pattern: 'An earlier goal no longer fits who you are becoming', evidence: 'I used to want a leadership role', interpretation: 'It may be that your values have shifted toward depth of work over scope, which could make the old goal feel like an obligation rather than a wish.' }
    ], question: 'What would you want your work to give you a year from now?' }
];
const q = s => `'${String(s).replace(/'/g, "''")}'`;
console.log(`DELETE FROM insights WHERE user_id = ${q(id)};`);
console.log(`DELETE FROM users WHERE id = ${q(id)};`);
console.log(`INSERT INTO users (id, username, password_hash, password_salt, daily_limit, reviewer, created_at) VALUES (${q(id)}, ${q(username)}, ${q(hash)}, ${q(salt)}, 50, 1, ${now});`);
samples.forEach((s, i) => console.log(`INSERT INTO insights (id, user_id, result, created_at, expires_at) VALUES (${q(crypto.randomUUID())}, ${q(id)}, ${q(JSON.stringify(s))}, ${now - (i + 1) * day}, ${now + 3650 * day});`));
