# Quiet Coaching

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/icon-dark.png">
  <img src="assets/icon-light.png" alt="Hand-drawn geometric study for Quiet Coaching" width="160">
</picture>

A conversational skill for supporting a person’s agency: their capacity to form intentions, act, reflect and adapt. It connects the current request with relevant conversation and memory to guide direct help, reflection and thoughtful questions.

The assistant stays in the role the person has chosen. The skill brings facilitative communication into ordinary assistance.

[Read the skill](skills/quiet-coaching/SKILL.md).

[Support](SUPPORT.md) · [Privacy](PRIVACY.md) · [Terms](TERMS.md)

## Install from npm

Download it into a project with:

```sh
npm install quiet-coaching
```

The skill is then available at `node_modules/quiet-coaching/skills/quiet-coaching/SKILL.md`. Follow your assistant's instructions for installing or loading a skill from that folder. Installing the npm package alone does not activate the skill.

The npm package contains the skill, plugin manifest, icons and configuration for an optional remote MCP connection. Installing it alone does not connect or activate the service.

## Source

- `skills/quiet-coaching/SKILL.md` contains the complete skill and is the canonical source for edits.
- `plugin.json` defines the plugin and its listing.
- `mcp.json` points to the optional Cognitive Insights service.

## Cognitive Insights

Cognitive Insights is an invitation-only service that can examine a short excerpt you choose and offer tentative observations and questions. Connect it only if you want to use it. Your assistant should ask for your explicit permission before sending each excerpt. Do not share credentials, payment card details, government identifiers, medical records or other sensitive personal data. The excerpt is processed by a private Codex runner and its AI provider. The service does not receive your full conversation automatically. During the private beta, each invitation can request up to 20 analyses per UTC day. See [Privacy](PRIVACY.md) for storage and deletion details.

The Quiet Coaching skill can also be used on its own with the conversation and memory features available in the host.

## License

No license has been selected yet.
