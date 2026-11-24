// Username and password accounts for the OAuth sign-in page.
// Passwords are hashed with PBKDF2-SHA256 (100,000 iterations, the Workers maximum) and a per-user salt.

const ITERATIONS = 100000;
const enc = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
const unhex = text => Uint8Array.from(text.match(/../g), h => parseInt(h, 16));

export const USERNAME_RULE = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const MIN_PASSWORD = 10;

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? unhex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return { hash: hex(bits), salt: hex(salt) };
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateNewAccount(username, password) {
  if (!USERNAME_RULE.test(username)) return 'Choose a username of 3 to 32 characters: lowercase letters, digits, dots, hyphens or underscores.';
  if (String(password ?? '').length < MIN_PASSWORD) return `Choose a password of at least ${MIN_PASSWORD} characters.`;
  if (String(password).length > 200) return 'Choose a shorter password.';
  return null;
}

export async function createUser(db, username, password, now = Date.now()) {
  const problem = validateNewAccount(username, password);
  if (problem) return { error: problem };
  const existing = await db.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first();
  if (existing) return { error: 'That username is taken. Sign in instead, or choose another.' };
  const { hash, salt } = await hashPassword(password);
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO users (id, username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, username, hash, salt, now).run();
  return { id, username };
}

export async function verifyUser(db, username, password) {
  const row = await db.prepare('SELECT id, username, password_hash, password_salt FROM users WHERE username = ?').bind(username).first();
  // Hash even for unknown users so response time does not reveal which usernames exist.
  const { hash } = await hashPassword(String(password ?? ''), row?.password_salt ?? '00'.repeat(16));
  if (!row || !sameString(hash, row.password_hash)) return null;
  return { id: row.id, username: row.username };
}

export async function userExists(db, id) {
  return Boolean(id && await db.prepare('SELECT 1 FROM users WHERE id = ?').bind(id).first());
}

export async function deleteUser(db, id) {
  await db.batch([
    db.prepare('DELETE FROM insights WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM users WHERE id = ?').bind(id)
  ]);
}
