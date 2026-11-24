// Server-rendered pages: sign-in for OAuth, landing page and account deletion.

export const LINKS = {
  repo: 'https://github.com/domnovoz/quiet-coaching',
  privacy: 'https://github.com/domnovoz/quiet-coaching/blob/main/PRIVACY.md',
  terms: 'https://github.com/domnovoz/quiet-coaching/blob/main/TERMS.md',
  support: 'https://github.com/domnovoz/quiet-coaching/blob/main/SUPPORT.md'
};

export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

const style = `
:root{--bg:#f7f6f2;--fg:#1d2420;--muted:#5b655f;--line:#d9dcd4;--accent:#2f6b4f;--card:#fff;--err:#9b2c2c}
@media (prefers-color-scheme:dark){:root{--bg:#141815;--fg:#e8ebe6;--muted:#a3ada6;--line:#2e3530;--accent:#7cc29c;--card:#1b201c;--err:#f08a8a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:34rem;margin:0 auto;padding:2.5rem 1rem}h1{font-size:1.5rem;margin:0 0 .5rem}h2{font-size:1.05rem;margin:0 0 .75rem}
p{margin:.5rem 0}.muted{color:var(--muted);font-size:.92rem}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1.25rem;margin:1rem 0}
label{display:block;margin:.6rem 0 .25rem;font-weight:600;font-size:.92rem}input{width:100%;padding:.6rem .7rem;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit}
button{margin-top:1rem;padding:.6rem 1rem;border:0;border-radius:8px;background:var(--accent);color:var(--card);font:inherit;font-weight:600;cursor:pointer}
button.secondary{background:transparent;color:var(--muted);border:1px solid var(--line)}.err{color:var(--err);font-weight:600}a{color:var(--accent)}
.row{display:flex;gap:.5rem;flex-wrap:wrap}`;

const shell = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" type="image/png" href="/favicon.png"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><style>${style}</style></head><body><main>${body}<p class="muted"><a href="${LINKS.privacy}">Privacy</a> · <a href="${LINKS.terms}">Terms</a> · <a href="${LINKS.support}">Support</a></p></main></body></html>`;

const dataNote = `<p class="muted">Quiet Coaching Insights analyzes only short excerpts you explicitly agree to share. The excerpt is processed by Cloudflare Workers AI and is not stored. The resulting insights are saved to your account for up to 90 days, and you can delete them at any time. Do not share passwords, payment details, government identifiers or health records.</p>`;

export function signInPage({ clientName, redirectHost, handle, error, username = '', mode = 'signin' }) {
  const account = (heading, action, autocomplete, hint) => `<form method="post" class="card"><h2>${heading}</h2>
<input type="hidden" name="handle" value="${escape(handle)}"><input type="hidden" name="action" value="${action}">
<label for="u-${action}">Username</label><input id="u-${action}" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${mode === action ? escape(username) : ''}">
<label for="p-${action}">Password</label><input id="p-${action}" name="password" type="password" autocomplete="${autocomplete}" required>
${hint}<div class="row"><button type="submit">${heading}</button></div></form>`;
  return shell('Connect Quiet Coaching', `<h1>Connect Quiet Coaching</h1>
<p><strong>${escape(clientName || 'An assistant')}</strong> is asking to use Quiet Coaching Insights on your behalf. You will return to ${escape(redirectHost)}.</p>
${error ? `<p class="err" role="alert">${escape(error)}</p>` : ''}
${account('Sign in', 'signin', 'current-password', '')}
${account('Create account', 'signup', 'new-password', '<p class="muted">Free. No email needed. Use 3 to 32 lowercase letters or digits for the username and at least 10 characters for the password. There is no password recovery, so keep it somewhere safe.</p>')}
<form method="post"><input type="hidden" name="handle" value="${escape(handle)}"><input type="hidden" name="action" value="deny"><button class="secondary" type="submit">Cancel</button></form>
${dataNote}`);
}

export function landingPage(origin) {
  return shell('Quiet Coaching Insights', `<h1>Quiet Coaching Insights</h1>
<p>The optional companion service for the <a href="${LINKS.repo}">Quiet Coaching</a> plugin. When you choose to share a short excerpt, it highlights up to three patterns in your own words and offers one open question to help you decide what matters to you.</p>
<p>Connect it in ChatGPT or Claude with this MCP address:</p><p><code>${escape(origin)}/mcp</code></p>
${dataNote}
<p class="muted">Want to remove your account? <a href="/account">Delete your account</a>.</p>`);
}

export function accountPage({ error, done } = {}) {
  if (done) return shell('Account deleted', '<h1>Account deleted</h1><p>Your account and all saved insights have been removed.</p>');
  return shell('Delete account', `<h1>Delete your account</h1>
<p>This permanently removes your account and every saved insight. It cannot be undone.</p>
${error ? `<p class="err" role="alert">${escape(error)}</p>` : ''}
<form method="post" class="card"><label for="u">Username</label><input id="u" name="username" autocomplete="username" autocapitalize="none" required>
<label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Delete account permanently</button></form>`);
}
