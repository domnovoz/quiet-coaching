// End-to-end check through the real OAuth and MCP flow.
// Usage: node scripts/e2e.mjs <base-url> [username password]
// Without credentials it creates a fresh test account (username e2e-<random>) and deletes it at the end.
import { createHash, randomBytes } from 'node:crypto';

const base = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');
let [username, password] = process.argv.slice(3);
const fresh = !username;
if (fresh) { username = `e2e-${randomBytes(4).toString('hex')}`; password = randomBytes(12).toString('hex'); }
const b64url = buf => Buffer.from(buf).toString('base64url');
const redirect = 'https://example.com/callback';
const step = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`); if (!ok) process.exitCode = 1; return ok; };

const meta = await (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`)).json().catch(() => null);
step('protected resource metadata', meta?.resource?.endsWith('/mcp'), meta?.resource);
const as = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json();
step('authorization server metadata', Boolean(as.authorization_endpoint));

const reg = await (await fetch(`${base}/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: 'E2E test', redirect_uris: [redirect], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }) })).json();
step('dynamic client registration', Boolean(reg.client_id));

const verifier = b64url(randomBytes(32));
const challenge = b64url(createHash('sha256').update(verifier).digest());
const q = new URLSearchParams({ response_type: 'code', client_id: reg.client_id, redirect_uri: redirect, state: 's1', code_challenge: challenge, code_challenge_method: 'S256', scope: 'mcp', resource: `${base}/mcp` });
const page = await fetch(`${base}/authorize?${q}`);
const pageHtml = await page.text();
const cookie = (page.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
const handle = pageHtml.match(/name="handle" value="([^"]+)"/)?.[1]?.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
step('sign-in page', page.status === 200 && Boolean(handle));

const form = new URLSearchParams({ handle, action: fresh ? 'signup' : 'signin', username, password });
const approve = await fetch(`${base}/authorize`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(cookie ? { Cookie: cookie } : {}) }, body: form });
const location = approve.headers.get('location') || '';
const code = new URL(location || 'http://x').searchParams.get('code');
if (!step(fresh ? 'create account and authorize' : 'sign in and authorize', approve.status === 302 && Boolean(code), approve.status === 302 ? '' : (await approve.text()).match(/role="alert">([^<]+)/)?.[1])) process.exit(1);

const token = await (await fetch(`${base}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: reg.client_id, code_verifier: verifier }) })).json();
step('token exchange', Boolean(token.access_token) && Boolean(token.refresh_token));

let rpcId = 0;
async function rpc(method, params) {
  const res = await fetch(`${base}/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }) });
  const body = await res.json();
  if (body.error) throw new Error(JSON.stringify(body.error));
  return body.result;
}
const call = async (name, args = {}) => rpc('tools/call', { name, arguments: args });

const noAuth = await fetch(`${base}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
step('unauthenticated MCP refused', noAuth.status === 401 && /resource_metadata/.test(noAuth.headers.get('www-authenticate') || ''));

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } });
step('initialize', init.serverInfo?.name === 'quiet-coaching-insights', init.serverInfo?.version);
const { tools } = await rpc('tools/list', {});
const names = tools.map(t => t.name).sort();
step('tools listed', names.join(',') === 'analyze_excerpt,delete_all_insights,delete_insight,list_insights', names.join(','));
for (const t of tools) step(`annotations ${t.name}`, typeof t.annotations?.readOnlyHint === 'boolean' && typeof t.annotations?.destructiveHint === 'boolean' && typeof t.annotations?.openWorldHint === 'boolean' && Boolean(t.title));

const refused = await call('analyze_excerpt', { excerpt: 'I keep postponing the first step.', consent: false });
step('analysis without consent refused', refused.isError === true);
const blocked = await call('analyze_excerpt', { excerpt: 'my password: hunter2hunter2', consent: true });
step('restricted data refused', blocked.isError === true);

const t0 = Date.now();
const made = await call('analyze_excerpt', { excerpt: 'I want to change jobs, but every time I sit down to update my CV I find something more urgent. I used to be the person who always took the leap.', consent: true });
const insight = made.structuredContent;
step('analysis returns patterns', !made.isError && (insight?.patterns?.length > 0 || Boolean(insight?.summary)), made.isError ? made.content?.[0]?.text : `${insight.patterns.length} patterns, ${Date.now() - t0} ms`);
if (insight?.patterns) console.log(JSON.stringify(insight, null, 2));

const listed = await call('list_insights', { limit: 5 });
step('list includes new insight', listed.structuredContent?.insights?.some(i => i.id === insight?.id));
const removed = await call('delete_insight', { id: insight?.id ?? '00000000-0000-4000-8000-000000000000' });
step('delete one', removed.structuredContent?.deleted === true);
const after = await call('list_insights', {});
step('deleted insight gone', !after.structuredContent?.insights?.some(i => i.id === insight?.id));

if (fresh) {
  const del = await fetch(`${base}/account`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username, password }) });
  step('account deletion', del.status === 200 && /Account deleted/.test(await del.text()));
  const gone = await fetch(`${base}/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'tools/list' }) });
  step('token refused after account deletion', gone.status === 401);
}
console.log(process.exitCode ? 'E2E FAILED' : 'E2E PASSED');
