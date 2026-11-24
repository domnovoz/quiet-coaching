# Privacy policy

Last updated: 24 November 2026

Quiet Coaching is published by Dominik Novozámský ("we"). This policy covers the Quiet Coaching skill and the optional Quiet Coaching Insights service at `https://mcp.dominiknovozamsky.com` (also served for ChatGPT at `https://quiet-coaching-cognitive-insights.domnovoz.workers.dev`; both are the same service and database).

## The skill

The Quiet Coaching skill is a set of instructions that runs inside the assistant you already use, such as ChatGPT or Claude. It sends nothing to us. Your conversations and memory stay with that assistant's provider and are governed by its privacy policy and your settings there.

## Quiet Coaching Insights

Insights is optional. It runs only when you connect it and ask your assistant to analyze a specific excerpt that you agree to share.

**What we collect**

| Data | Why | How long |
| --- | --- | --- |
| Username and a salted password hash | To sign you in | Until you delete your account |
| The excerpt you agree to share | To produce the analysis | Not stored. It is processed in memory and discarded when the analysis returns |
| The analysis result (patterns, short quotes from your excerpt, interpretations and one question) | So you can review earlier insights | Up to 90 days, or until you delete it |
| Daily usage counters keyed to your account, and a one-way hash of the network address used to create accounts | Fair use of the free allowance and abuse prevention | Removed after the day ends |
| Sign-in tokens issued to your assistant | To keep the connection signed in | Access tokens expire after 1 hour, refresh tokens after 90 days |
| Error logs without excerpt or result content | To keep the service working | Up to 7 days in Cloudflare logs |

We do not ask for your email, name or any other profile information. We do not request or reconstruct your conversation history, memory or files. We do not sell data, use it for advertising, share it with third parties for their own purposes, or use your excerpts or results to train models.

**Who processes it.** The service runs on Cloudflare Workers, D1 and KV, and analysis runs on Cloudflare Workers AI. Cloudflare processes this data on our behalf under the [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/). Deleted database records may remain in Cloudflare's point-in-time recovery history for up to 7 days before they are permanently gone.

**What not to share.** Do not share passwords, keys, payment card numbers, government identifiers, health records or other people's private information. The service rejects some of these automatically, but it cannot detect everything.

**Your controls**

- Ask your assistant to list your saved insights, delete one, or delete all of them.
- Delete your account and everything in it at [mcp.dominiknovozamsky.com/account](https://mcp.dominiknovozamsky.com/account).
- Disconnect Insights at any time in your assistant's connector or app settings.
- For any other request, including access or correction, email [domnovoz@gmail.com](mailto:domnovoz@gmail.com).

**Age.** The service is not directed at children under 13. If you are under 18, use it only with the permission of a parent or guardian.

**Changes.** We will update this page and its date when this policy changes.
