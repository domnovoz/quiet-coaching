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

The npm package contains the skill, plugin manifest and icons. It does not include an MCP server or connect to a third-party service.

## Source

- `skills/quiet-coaching/SKILL.md` contains the complete skill and is the canonical source for edits.
- `plugin.json` defines the skills-only plugin and its draft listing.

The package has no MCP server, backend or bundled memory service. It uses the conversation and memory capabilities available in the host.

## License

No license has been selected yet.
