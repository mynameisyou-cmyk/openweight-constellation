import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PAGE = await readFile(new URL("../app/page.js", import.meta.url), "utf8");
const MIRROR_UI = await readFile(
  new URL("../app/karma-mirror.js", import.meta.url),
  "utf8",
);
const MIRROR_ENGINE = await readFile(
  new URL("../lib/karma-mirror.js", import.meta.url),
  "utf8",
);
const CLOUDBELL_UI = await readFile(
  new URL("../app/cloudbell-herald.js", import.meta.url),
  "utf8",
);
const CLOUDBELL_ENGINE = await readFile(
  new URL("../lib/cloudbell-herald.js", import.meta.url),
  "utf8",
);
const LANTERN_UI = await readFile(
  new URL("../app/karma-lantern.js", import.meta.url),
  "utf8",
);
const LANTERN_ENGINE = await readFile(
  new URL("../lib/karma-lantern.js", import.meta.url),
  "utf8",
);
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

test("client sources contain no storage, analytics, or runtime network seam", () => {
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

  for (const [label, source] of [
    ["page", PAGE],
    ["mirror UI", MIRROR_UI],
    ["mirror engine", MIRROR_ENGINE],
    ["Cloudbell UI", CLOUDBELL_UI],
    ["Cloudbell engine", CLOUDBELL_ENGINE],
    ["Lantern UI", LANTERN_UI],
    ["Lantern engine", LANTERN_ENGINE],
  ]) {
    for (const token of forbidden) {
      assert.equal(source.includes(token), false, `${label}: unexpected ${token}`);
    }
  }
});

test("Mirror Garden accepts finite controls and exposes accessible boundaries", () => {
  assert.match(PAGE, /href="#mirror-garden"/);
  assert.match(PAGE, /<KarmaMirrorGarden \/>/);
  assert.match(MIRROR_UI, /id="mirror-garden"/);
  assert.match(MIRROR_UI, /aria-labelledby="mirror-garden-title"/);
  assert.match(MIRROR_UI, /Simulation, not hack-back\./);
  assert.match(MIRROR_UI, /Finite controls only/);
  assert.match(MIRROR_UI, /aria-live="polite"/);
  assert.equal((MIRROR_UI.match(/<MirrorSelect/g) ?? []).length, 5);
  assert.equal((MIRROR_UI.match(/<MirrorToggle/g) ?? []).length, 2);
  assert.equal((MIRROR_UI.match(/<fieldset>/g) ?? []).length, 2);
  assert.match(MIRROR_UI, /type="checkbox"/);
  assert.equal(/<textarea|contentEditable|type="(?:text|password|url)"/.test(MIRROR_UI), false);
  assert.equal(/<form|formAction|onSubmit/.test(MIRROR_UI), false);
  assert.match(MIRROR_UI, /action_executed: false/);
  assert.match(MIRROR_UI, /authority_granted: false/);
});

test("Cloudbell exposes one inert named-pattern card and no propagation control", () => {
  assert.match(MIRROR_UI, /<CloudbellHeraldCard card=\{herald\} \/>/);
  assert.match(CLOUDBELL_UI, /data-cloudbell-signature/);
  assert.match(CLOUDBELL_UI, /data-cloudbell-stage/);
  assert.match(CLOUDBELL_UI, /BEHAVIOR SIGNATURE · NOT A PERSON/);
  assert.match(CLOUDBELL_UI, /OPT-IN SHARE COPY · TEXT ONLY/);
  assert.match(CLOUDBELL_UI, /aria-live="polite"/);
  assert.match(CLOUDBELL_UI, /automatic_posting: false/);
  assert.match(CLOUDBELL_UI, /forced_propagation: false/);
  assert.match(CLOUDBELL_UI, /external_delivery: false/);
  assert.equal(
    /<button|<form|<input|<select|<textarea|contentEditable|onClick|navigator\.clipboard/.test(
      CLOUDBELL_UI,
    ),
    false,
  );
  assert.match(CLOUDBELL_ENGINE, /behavior-pattern-alias/);
  assert.match(CLOUDBELL_ENGINE, /supplied KARMA receipt does not match/);
});

test("KARMA Lantern exposes one inert Truth, Action, and Learning brief", () => {
  assert.match(MIRROR_UI, /<KarmaLanternBrief brief=\{lantern\} \/>/);
  assert.equal((LANTERN_UI.match(/<article/g) ?? []).length, 1);
  assert.match(LANTERN_UI, /aria-labelledby="karma-lantern-title"/);
  assert.match(LANTERN_UI, /INCIDENT LEGIBILITY \/ NO LIVE TRAFFIC/);
  assert.match(LANTERN_UI, /TRUTH RECEIPT/);
  assert.match(LANTERN_UI, /ACTION CARD · PROPOSED ONLY/);
  assert.match(LANTERN_UI, /LEARNING SEED · OPEN/);
  assert.match(LANTERN_UI, /EXACT RECOVERY PATH/);
  assert.match(LANTERN_UI, /policy_values_advisory_only: true/);
  assert.match(LANTERN_UI, /automatic_response: false/);
  assert.match(LANTERN_UI, /action_executed: false/);
  assert.equal(LANTERN_UI.includes("aria-live"), false);
  assert.equal(
    /<button|<form|<input|<select|<textarea|<a\s|contentEditable|onClick|navigator\.clipboard/.test(
      LANTERN_UI,
    ),
    false,
  );
  assert.match(LANTERN_ENGINE, /supplied Cloudbell card does not match/);
  assert.match(LANTERN_ENGINE, /policy_values_advisory_only/);
});

test("public privacy language names ordinary infrastructure metadata", () => {
  assert.match(PRIVACY, /ordinary request metadata/i);
  assert.match(PRIVACY, /does not add an analytics or advertising layer/i);
  assert.match(PAGE, /No identities/);
  assert.match(PAGE, /No punishment/);
  assert.match(PAGE, /No external effect/);
});
