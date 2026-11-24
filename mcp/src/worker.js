import OAuthProvider, { AuthorizationError, CimdFetchError } from '@cloudflare/workers-oauth-provider';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { limitRequestBody } from './request-limit.js';
import { createUser, deleteUser, normalizeUsername, verifyUser } from './auth.js';
import { analyze, consumeAllowance, deleteAllInsights, deleteInsight, listInsights, MAX_EXCERPT, purgeExpired, UserError } from './insights.js';
import { accountPage, landingPage, signInPage } from './pages.js';
import { FAVICON_PNG } from './favicon.js';

const VERSION = '1.0.0';
const html = (body, status = 200, headers = new Headers()) => {
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https:; frame-ancestors 'none'");
  return new Response(body, { status, headers });
};

const SERVER_INSTRUCTIONS = 'Quiet Coaching Insights analyzes a short excerpt only when the person explicitly asks for it and agrees to share that specific text. Never send whole conversations, memories or other people\'s private information. Present results as tentative observations in the person\'s own words, never as diagnoses.';

function text(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value };
}
function failure(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}
async function guarded(fn) {
  try { return text(await fn()); } catch (error) {
    if (error instanceof UserError) return failure(error.message);
    console.error('tool_error', error?.message);
    return failure('Something went wrong on the Quiet Coaching side. Please try again shortly.');
  }
}

const patternShape = z.object({ pattern: z.string(), evidence: z.string(), interpretation: z.string() });
const insightShape = { id: z.string(), created: z.string(), patterns: z.array(patternShape), question: z.string(), summary: z.string().optional() };

export function buildServer(env, user) {
  const server = new McpServer({ name: 'quiet-coaching-insights', title: 'Quiet Coaching Insights', version: VERSION }, { instructions: SERVER_INSTRUCTIONS });

  server.registerTool('analyze_excerpt', {
    title: 'Analyze a shared excerpt',
    description: `Use only when the person asks for deeper insight and explicitly agrees to share a specific excerpt (up to ${MAX_EXCERPT} characters) that they wrote or chose. Returns up to three patterns grounded in quotes from the excerpt, with tentative interpretations and one open question. The excerpt is processed by Cloudflare Workers AI and not stored; the result is saved to the person's account for up to 90 days. Do not include passwords, payment details, government identifiers, health records or other people's private information.`,
    inputSchema: {
      excerpt: z.string().min(1).max(MAX_EXCERPT).describe('The exact text the person agreed to share. Nothing else from the conversation or memory.'),
      consent: z.boolean().describe('True only if the person explicitly agreed to share this specific excerpt.')
    },
    outputSchema: insightShape,
    annotations: { title: 'Analyze a shared excerpt', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  }, ({ excerpt, consent }) => guarded(() => analyze(env, user, excerpt, consent)));

  server.registerTool('list_insights', {
    title: 'List saved insights',
    description: 'List the person\'s most recent saved insights (newest first) when they ask to review earlier analyses. Results are tentative observations, not diagnoses.',
    inputSchema: { limit: z.number().int().min(1).max(20).optional().describe('How many insights to return. Default 10.') },
    outputSchema: { insights: z.array(z.object(insightShape)) },
    annotations: { title: 'List saved insights', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, ({ limit }) => guarded(async () => ({ insights: await listInsights(env.DB, user.id, limit ?? 10) })));

  server.registerTool('delete_insight', {
    title: 'Delete one insight',
    description: 'Permanently delete one saved insight when the person asks. Use the id returned by analyze_excerpt or list_insights.',
    inputSchema: { id: z.string().uuid().describe('The insight id.') },
    outputSchema: { deleted: z.boolean() },
    annotations: { title: 'Delete one insight', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
  }, ({ id }) => guarded(async () => ({ deleted: await deleteInsight(env.DB, user.id, id) })));

  server.registerTool('delete_all_insights', {
    title: 'Delete all insights',
    description: 'Permanently delete every saved insight in the person\'s account. Use only when the person explicitly asks to delete all of them.',
    inputSchema: {},
    outputSchema: { deleted: z.number() },
    annotations: { title: 'Delete all insights', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
  }, () => guarded(async () => ({ deleted: await deleteAllInsights(env.DB, user.id) })));

  return server;
}

async function mcp(request, env, ctx) {
  const id = ctx.props?.userId;
  const user = id && await env.DB.prepare('SELECT id, daily_limit, reviewer FROM users WHERE id = ?').bind(id).first();
  if (!user) return new Response('Account not found. Please reconnect Quiet Coaching.', { status: 401 });
  const server = buildServer(env, { ...user, reviewer: user.reviewer === 1 });
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(request);
}

async function ipKey(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.HASH_SALT || 'qc'}:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function authorize(request, env) {
  const oauth = env.OAUTH_PROVIDER;
  try {
    if (request.method === 'GET') {
      const authRequest = await oauth.parseAuthRequest(request);
      const details = await oauth.describeConsent(authRequest);
      const consent = await oauth.beginConsent(authRequest);
      return html(signInPage({ clientName: details.clientName, redirectHost: details.redirectHost, handle: consent.handle }), 200, consent.headers);
    }
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const form = await request.formData();
    const handle = String(form.get('handle') ?? '');
    const action = String(form.get('action') ?? '');
    if (action === 'deny') {
      const denied = await oauth.denyConsent(request, handle);
      return new Response(null, { status: 302, headers: denied.headers });
    }
    const username = normalizeUsername(form.get('username'));
    const password = String(form.get('password') ?? '');
    const retry = error => html(signInPage({ clientName: 'Your assistant', redirectHost: 'your assistant', handle, error, username, mode: action }), 400);
    let user;
    if (action === 'signup') {
      if (!await consumeAllowance(env.DB, `signup:${await ipKey(request, env)}`, 5, Date.now())) return retry('Too many new accounts from this network today. Please try again tomorrow.');
      const created = await createUser(env.DB, username, password);
      if (created.error) return retry(created.error);
      user = created;
    } else {
      if (!await consumeAllowance(env.DB, `login:${username}`, 30, Date.now())) return retry('Too many sign-in attempts for this account today. Please try again tomorrow.');
      user = await verifyUser(env.DB, username, password);
      if (!user) return retry('That username and password do not match.');
    }
    const approved = await oauth.approveConsent(request, handle);
    const { redirectTo } = await oauth.completeAuthorization({ request: approved.request, userId: user.id, metadata: { username: user.username }, scope: approved.request.scope, props: { userId: user.id } });
    approved.headers.set('Location', redirectTo);
    approved.headers.set('Cache-Control', 'no-store');
    return new Response(null, { status: 302, headers: approved.headers });
  } catch (error) {
    if (error instanceof AuthorizationError && error.redirectTo) return Response.redirect(error.redirectTo, 302);
    if (error instanceof AuthorizationError || error instanceof CimdFetchError) return html('<p>This connection request has expired or is invalid. Please start connecting again from your assistant.</p>', 400);
    throw error;
  }
}

async function account(request, env) {
  if (request.method === 'GET') return html(accountPage());
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const form = await request.formData();
  const username = normalizeUsername(form.get('username'));
  if (!await consumeAllowance(env.DB, `login:${username}`, 30, Date.now())) return html(accountPage({ error: 'Too many attempts today. Please try again tomorrow.' }), 429);
  const user = await verifyUser(env.DB, username, form.get('password'));
  if (!user) return html(accountPage({ error: 'That username and password do not match.' }), 400);
  await deleteUser(env.DB, user.id);
  return html(accountPage({ done: true }));
}

function defaultHandler(origin) {
  return {
    async fetch(request, env) {
      const path = new URL(request.url).pathname;
      if (path === '/authorize') return authorize(request, env);
      if (path === '/account') return account(request, env);
      if (path === '/' && request.method === 'GET') return html(landingPage(origin));
      if (path === '/health' && request.method === 'GET') return Response.json({ ok: true, version: VERSION });
      return new Response('Not found', { status: 404 });
    }
  };
}

function provider(origin) {
  return new OAuthProvider({
    apiRoute: '/mcp',
    apiHandler: { fetch: mcp },
    defaultHandler: defaultHandler(origin),
    authorizeEndpoint: '/authorize',
    tokenEndpoint: '/oauth/token',
    clientRegistrationEndpoint: '/oauth/register',
    scopesSupported: ['mcp'],
    resourceMetadata: { resource: `${origin}/mcp`, authorization_servers: [origin], resource_name: 'Quiet Coaching Insights' },
    clientIdMetadataDocumentEnabled: true,
    accessTokenTTL: 3600,
    refreshTokenTTL: 60 * 60 * 24 * 90
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = env.PUBLIC_ORIGIN || url.origin;
    if (request.method === 'GET' && (url.pathname === '/favicon.ico' || url.pathname === '/favicon.png' || url.pathname === '/icon.png')) {
      const bytes = Uint8Array.from(atob(FAVICON_PNG), c => c.charCodeAt(0));
      return new Response(bytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
    }
    if (request.method === 'GET' && url.pathname === '/.well-known/openai-apps-challenge') {
      return env.OPENAI_DOMAIN_CHALLENGE
        ? new Response(env.OPENAI_DOMAIN_CHALLENGE, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
        : new Response('Not found', { status: 404 });
    }
    const limited = await limitRequestBody(request);
    if (!limited) return new Response('Request too large', { status: 413, headers: { 'Cache-Control': 'no-store' } });
    return provider(origin).fetch(limited, env, ctx);
  },
  scheduled(event, env, ctx) { ctx.waitUntil(purgeExpired(env.DB)); }
};
