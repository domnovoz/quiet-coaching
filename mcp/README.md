# Quiet Coaching Insights MCP

Cloudflare Worker that serves the Insights MCP server at `https://mcp.dominiknovozamsky.com/mcp`.

- OAuth 2.1 with dynamic client registration and PKCE (`@cloudflare/workers-oauth-provider`), tokens in KV.
- Username and password accounts (PBKDF2-SHA256) on the `/authorize` page. No email, no codes.
- MCP over streamable HTTP (`@modelcontextprotocol/sdk`), four tools with explicit annotations.
- Analysis with Workers AI (`MODEL` var). Excerpts are never written to storage; results go to D1 for 90 days.
- Free-tier guards: per-user daily limit (default 10), global daily limit (`GLOBAL_DAILY_LIMIT`), sign-up limit per network, sign-in attempt limit.

## Commands

```sh
npm install
npm test                                   # unit tests
npx wrangler d1 execute quiet-coaching-mcp --remote --file=schema.sql
npx wrangler deploy
node scripts/e2e.mjs https://mcp.dominiknovozamsky.com          # full live OAuth + MCP test with a throwaway account
node scripts/e2e.mjs https://mcp.dominiknovozamsky.com <user> <password>   # same, signing in to an existing account
```

Secrets (`npx wrangler secret put <NAME>`): `EXTRACTOR_PROMPT` (private analysis instructions; a minimal default is built in), `HASH_SALT`, and `OPENAI_DOMAIN_CHALLENGE` (value from the OpenAI plugin portal, served at `/.well-known/openai-apps-challenge`).

The app-review account is created with `node scripts/reviewer.mjs <user> <password>`, which prints SQL for `wrangler d1 execute`. It is flagged `reviewer`, exempt from the global limit, and seeded with two sample insights.
