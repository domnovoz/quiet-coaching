// Owner-only: get an access token for the openai-reviewer test account without its password,
// using the ADMIN_SECRET kept in this Mac's Keychain (service quiet-coaching-mcp-admin).
// Usage: node scripts/demo-token.mjs <base-url> <output-json-file>
// Writes {"access_token": ...} to the output file; never prints the token.
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'https://mcp.dominiknovozamsky.com').replace(/\/$/, '');
const out = process.argv[3];
if (!out) throw new Error('output file required');
const admin = execFileSync('security', ['find-generic-password', '-s', 'quiet-coaching-mcp-admin', '-a', 'owner', '-w']).toString().trim();
const redirect = 'http://127.0.0.1:53682/callback';
const b64url = buf => Buffer.from(buf).toString('base64url');

const reg = await (await fetch(`${base}/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: 'Owner demo', redirect_uris: [redirect], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }) })).json();
const verifier = b64url(randomBytes(32));
const challenge = b64url(createHash('sha256').update(verifier).digest());
const q = new URLSearchParams({ response_type: 'code', client_id: reg.client_id, redirect_uri: redirect, state: 'demo', code_challenge: challenge, code_challenge_method: 'S256', scope: 'mcp', resource: `${base}/mcp` });
const page = await (await fetch(`${base}/authorize?${q}`)).text();
const handle = page.match(/name="handle" value="([^"]+)"/)?.[1];
if (!handle) throw new Error('no sign-in handle');
const approved = await (await fetch(`${base}/admin/demo-approve`, { method: 'POST', headers: { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ handle }) })).json();
const code = approved.redirectTo && new URL(approved.redirectTo).searchParams.get('code');
if (!code) throw new Error(`approval failed: ${JSON.stringify(approved)}`);
const token = await (await fetch(`${base}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: reg.client_id, code_verifier: verifier, resource: `${base}/mcp` }) })).json();
if (!token.access_token) throw new Error('token exchange failed');
writeFileSync(out, JSON.stringify({ access_token: token.access_token, expires_in: token.expires_in }), { mode: 0o600 });
console.log(`token written, expires in ${token.expires_in}s`);
