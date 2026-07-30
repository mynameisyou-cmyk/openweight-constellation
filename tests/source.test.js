import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PAGE = await readFile(new URL("../app/page.js", import.meta.url), "utf8");
const PRIVACY = await readFile(
  new URL("../app/privacy/page.js", import.meta.url),
  "utf8",
);
const PROTOCOL = JSON.parse(
  await readFile(
    new URL("../public/constellation-protocol.json", import.meta.url),
    "utf8",
  ),
);

const PUBLIC_URLS = [
  "https://virtue-without-sovereignty-mirror.vercel.app",
  "https://mixture-of-ends-mirror.vercel.app",
  "https://constitutional-archipelago-mirror.vercel.app",
  "https://the-897th-seat-mirror.vercel.app",
];

test("all four public worlds are present exactly once in the protocol", () => {
  assert.equal(PROTOCOL.worlds.length, 4);
  assert.deepEqual(
    PROTOCOL.worlds.map(({ url }) => url),
    PUBLIC_URLS,
  );
  assert.equal(new Set(PROTOCOL.worlds.map(({ id }) => id)).size, 4);
});

test("protocol advertises only the three read-only tools", () => {
  assert.deepEqual(PROTOCOL.mcp.tools, [
    "map_constellation",
    "compose_virtue_lens",
    "trace_idea",
  ]);
  assert.deepEqual(PROTOCOL.mcp.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  });
  assert.equal(PROTOCOL.authority, "reflective-only");
  assert.equal(PROTOCOL.external_effect, "none");
});

test("client source contains no storage, analytics, or runtime network seam", () => {
  const forbidden = [
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "gtag(",
    "analytics.",
    "fetch(",
    "XMLHttpRequest",
    "WebSocket(",
  ];

  for (const token of forbidden) {
    assert.equal(PAGE.includes(token), false, `unexpected token: ${token}`);
  }
});

test("public privacy language names ordinary infrastructure metadata", () => {
  assert.match(PRIVACY, /ordinary request metadata/i);
  assert.match(PRIVACY, /does not add an analytics or advertising layer/i);
  assert.match(PAGE, /No identities/);
  assert.match(PAGE, /No punishment/);
  assert.match(PAGE, /No external effect/);
});

