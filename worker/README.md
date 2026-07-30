# Openweight Constellation MCP edge

A Cloudflare Worker-hostable, public Streamable HTTP MCP service. It is a
deterministic, strictly read-only bridge to four public worlds:

- [Virtue Without Sovereignty](https://virtue-without-sovereignty-mirror.vercel.app)
- [Mixture of Ends](https://mixture-of-ends-mirror.vercel.app)
- [Constitutional Archipelago](https://constitutional-archipelago-mirror.vercel.app)
- [The 897th Seat](https://the-897th-seat-mirror.vercel.app)

## Surface

- `POST /mcp` — stateless Streamable HTTP in JSON response mode
- `OPTIONS /mcp` — public CORS preflight
- `GET /health` — minimal health response
- `GET /manifest.json` — machine-readable tools, sources, and constraints

Tools:

- `map_constellation` lists the four worlds and their governing questions.
- `compose_virtue_lens` transparently computes an advisory KARMA receipt
  from five integer observations between 0 and 100.
- `trace_idea` applies literal concept matching and stable interpretive lenses
  to a short user-supplied idea.

Every tool is annotated `readOnlyHint: true`, `destructiveHint: false`,
`idempotentHint: true`, and `openWorldHint: false`.
Every descriptor also declares `securitySchemes: [{ type: "noauth" }]` (and
the documented `_meta.securitySchemes` compatibility mirror), so ChatGPT can
recognize that the public tools require no account linking.

## Privacy and authority boundary

The Worker has no environment bindings and performs no model calls, runtime
fetches, authentication, cookies, storage, analytics, input logging, or
external writes. A fresh server and stateless transport are created for each
POST. GET and DELETE are not exposed on the MCP route, so there is no session
or mutation lane.

Requests with no `Origin` header (the normal server-to-server MCP case) are
accepted. Browser requests must present one of the exact origins published in
`/manifest.json`; every other present origin, including opaque `null` origins,
is rejected with HTTP 403.

The request-cost boundary is deterministic: MCP bodies are capped at 16 KiB,
JSON-RPC batches are rejected, tool inputs are tightly bounded, and all three
algorithms have fixed small outputs and no I/O. Per-client counters would
require identity and mutable state, contradicting this service's public
stateless contract. A production operator should therefore configure
Cloudflare's edge rate limiting in front of the Worker according to expected
traffic; it is intentionally not represented as an application storage
binding.

Virtue receipts are deterministic advisory feedback. They are not identity,
reputation, authorization, integrity proofs, or permission to coerce,
retaliate, surveil, or exploit.

The application does not emit logs or analytics; Cloudflare may still process
ordinary network metadata according to the operator's account and platform
policies.

## Verify locally

```sh
npm ci
npm run check
npm run test:twice
npx wrangler deploy --dry-run
```

Deployment is intentionally a separate, explicit action:

```sh
npm run deploy
```
