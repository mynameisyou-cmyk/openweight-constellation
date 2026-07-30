# Openweight Constellation

A public map joining four speculative civic instruments for plural open-weight
intelligence:

- Virtue Without Sovereignty
- Mixture of Ends
- Constitutional Archipelago
- The 897th Seat

The web instrument is browser-local. Its five-value virtue receipt is
deterministic, reflective-only, and has no external effect. The companion MCP
service exposes public information and the same deterministic lens through
strictly read-only tools.

Public MCP endpoint:
`https://openweight-constellation-mcp.axiepro.workers.dev/mcp`

## Boundaries

- No AI model or API call
- No credentials, accounts, cookies, browser storage, or application analytics
- No identity or person-level score
- No state-changing MCP tool
- No source publication implied by public deployment
- No affiliation with a model developer or hosting provider

## Local checks

```sh
npm test
npm run build:vercel
```

The `worker/` package contains the independently tested Cloudflare Worker MCP
endpoint. The `scripts/stage-hosting.mjs` adapter prepares a Vinext build for
ChatGPT Sites after `.openai/hosting.json` is created.
