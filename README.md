# Quiet Coaching

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/icon-dark.png">
  <img src="assets/icon-light.png" alt="Hand-drawn geometric study for Quiet Coaching" width="160">
</picture>

Coaching-informed conversation for ChatGPT and Claude. Quiet Coaching supports your agency: your ability to choose what you want, act on it, reflect and adapt. When the path is clear you get direct help; when your own answer matters more, you get a precise reflection or one focused question, grounded in what you have said and, where your settings allow, in memory.

**Quiet Coaching Insights** is an optional connection. When you want to understand a recurring pattern more deeply, share a short excerpt you choose and get up to three patterns grounded in your own words, a tentative interpretation of each and one open question. Free account, no email needed.

[Read the skill](plugin/skills/quiet-coaching/SKILL.md) · [Privacy](PRIVACY.md) · [Terms](TERMS.md) · [Support](SUPPORT.md)

## Install

**Claude Code**

```
/plugin install quiet-coaching --marketplace domnovoz/quiet-coaching
```

Or add the marketplace first with `/plugin marketplace add domnovoz/quiet-coaching`, then `/plugin install quiet-coaching@quiet-coaching`.

**Claude (web, desktop, mobile)**

- Skill: download [`quiet-coaching.zip`](https://github.com/domnovoz/quiet-coaching/releases/latest) and upload it in Settings > Capabilities > Skills.
- Insights: Settings > Connectors > Add custom connector, URL `https://mcp.dominiknovozamsky.com/mcp`, then sign in or create an account.

**ChatGPT**

Install Quiet Coaching from the ChatGPT plugin directory once it is listed. It includes the skill and the Insights connection.

**npm**

```sh
npm install quiet-coaching
```

The skill is at `node_modules/quiet-coaching/plugin/skills/quiet-coaching/SKILL.md`.

## How Insights handles data

- Your assistant shows you the exact excerpt and asks before sending it. Nothing else from your conversation or memory is sent.
- The excerpt is analyzed by Cloudflare Workers AI and not stored. The result is saved to your account for up to 90 days.
- Ask your assistant to list or delete your insights, or delete your account at [mcp.dominiknovozamsky.com/account](https://mcp.dominiknovozamsky.com/account).

Details are in the [privacy policy](PRIVACY.md).

## Insights tools

| Tool | What it does | Annotations |
| --- | --- | --- |
| `analyze_excerpt` | Analyzes an excerpt you agreed to share and saves the result | write, not destructive |
| `list_insights` | Lists your recent saved insights | read-only |
| `delete_insight` | Deletes one saved insight | destructive |
| `delete_all_insights` | Deletes all saved insights | destructive |

## Repository

```
plugin/                 the plugin (shared by ChatGPT and Claude)
  skills/quiet-coaching/SKILL.md
  plugin.json, mcp.json            ChatGPT plugin manifest and MCP connection
  .claude-plugin/plugin.json, .mcp.json   Claude plugin manifest and MCP connection
  assets/                          icons
mcp/                    Cloudflare Worker for Insights (OAuth, MCP tools, D1, Workers AI)
.claude-plugin/marketplace.json    Claude marketplace
```

The Worker runs entirely on Cloudflare's free tier. Production analysis instructions are supplied as a Worker secret and are not part of this repository. Development notes are in [mcp/README.md](mcp/README.md).

## License

All rights reserved. No license has been selected yet.
