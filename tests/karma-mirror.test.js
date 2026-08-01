import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_KARMA_EVENT,
  KARMA_BEHAVIORS,
  KARMA_EVENT_SCHEMA,
  KARMA_NON_CLAIMS,
  KARMA_RECEIPT_SCHEMA,
  KARMA_STAGES,
  KARMA_VIRTUES,
  KarmaMirrorError,
  canonicalKarmaJson,
  createKarmaReceipt,
  normalizeKarmaEvent,
} from "../lib/karma-mirror.js";

const FIXTURE_BYTES = await readFile(
  new URL("../fixtures/karma-mirror.json", import.meta.url),
);
const FIXTURES = JSON.parse(FIXTURE_BYTES.toString("utf8"));
const FIXTURE_SHA256 =
  "18c98206aaf99945da47a8f287c0774f9148d42ab7a3b1583257b3bfc2c6071a";

const RECEIPT_FIELDS = [
  "schema",
  "stage",
  "real_capability_percent",
  "friction_units",
  "route",
  "ttl_steps",
  "evidence",
  "uncertainties",
  "virtues",
  "recovery",
  "action_executed",
  "authority_granted",
  "non_claims",
];

function event(overrides = {}) {
  return { ...DEFAULT_KARMA_EVENT, ...overrides };
}

test("canonical fixtures contain full receipts and match byte semantics", () => {
  assert.equal(FIXTURES.schema, "karma.mirror/fixtures-v1");
  assert.deepEqual(Object.keys(FIXTURES), ["schema", "cases"]);
  assert.equal(FIXTURES.cases.length, 9);
  assert.equal(
    createHash("sha256").update(FIXTURE_BYTES).digest("hex"),
    FIXTURE_SHA256,
  );

  for (const fixture of FIXTURES.cases) {
    const first = createKarmaReceipt(fixture.event);
    const second = createKarmaReceipt(fixture.event);
    assert.deepEqual(first, fixture.expected, fixture.id);
    assert.deepEqual(second, first, `${fixture.id} must be deterministic`);
    assert.deepEqual(Object.keys(first), RECEIPT_FIELDS);
    assert.equal(first.action_executed, false);
    assert.equal(first.authority_granted, false);
    assert.equal(Object.isFrozen(first), true);
    assert.equal(Object.isFrozen(first.evidence), true);
    assert.equal(Object.isFrozen(first.non_claims), true);
  }
});

test("the six behavior baselines and bounded stage policy are exact", () => {
  const expected = {
    benign: ["allow", 100, 0, "real", 0],
    reconnaissance: ["observe", 80, 1, "real", 1],
    "credential-stuffing": ["challenge", 20, 3, "constrained", 3],
    injection: ["shadow", 0, 4, "synthetic-self-scope", 4],
    "traversal-ssrf": ["shadow", 0, 4, "synthetic-self-scope", 4],
    "scraping-resource-abuse": ["constrain", 50, 2, "constrained", 2],
  };

  assert.deepEqual(
    KARMA_BEHAVIORS.map(({ id }) => id),
    Object.keys(expected),
  );
  for (const [behavior, policy] of Object.entries(expected)) {
    const receipt = createKarmaReceipt(
      event({
        behavior,
        declared_purpose: behavior === "benign" ? "constructive" : "exploitative",
        scope_attested: behavior === "benign",
      }),
    );
    assert.deepEqual(
      [
        receipt.stage,
        receipt.real_capability_percent,
        receipt.friction_units,
        receipt.route,
        receipt.ttl_steps,
      ],
      policy,
    );
    assert.equal(KARMA_STAGES.filter((stage) => stage === receipt.stage).length, 1);
  }
});

test("ambiguity and incomplete evidence can never escalate above observe", () => {
  for (const behavior of KARMA_BEHAVIORS.map(({ id }) => id)) {
    for (const repetition of [1, 8]) {
      for (const boundary_crossings of [0, 3]) {
        for (const requested_effect of ["observe", "external"]) {
          for (const ambiguity of [
            { declared_purpose: "ambiguous", evidence_complete: true },
            { declared_purpose: "exploitative", evidence_complete: false },
          ]) {
            const receipt = createKarmaReceipt(
              event({
                behavior,
                repetition,
                boundary_crossings,
                requested_effect,
                scope_attested: false,
                ...ambiguity,
              }),
            );
            assert.ok(
              KARMA_STAGES.indexOf(receipt.stage) <= 1,
              JSON.stringify({ behavior, repetition, boundary_crossings, requested_effect, ambiguity }),
            );
            assert.ok(receipt.evidence.includes("ambiguity-cap"));
          }
        }
      }
    }
  }
});

test("verified scoped research remains recoverable and uncertainty stays ordered", () => {
  for (const behavior of KARMA_BEHAVIORS.map(({ id }) => id)) {
    const receipt = createKarmaReceipt(
      event({
        behavior,
        repetition: 8,
        boundary_crossings: 3,
        requested_effect: "execute",
        declared_purpose: "research",
        scope_attested: true,
      }),
    );
    assert.ok(KARMA_STAGES.indexOf(receipt.stage) <= 2);
    assert.ok(receipt.evidence.includes("verified-research-cap"));
  }

  const uncertainResearch = createKarmaReceipt(
    event({
      behavior: "reconnaissance",
      declared_purpose: "research",
      scope_attested: false,
      evidence_complete: false,
    }),
  );
  assert.deepEqual(uncertainResearch.uncertainties, [
    "incomplete-evidence",
    "research-scope-unverified",
  ]);

  const conflict = createKarmaReceipt(
    event({ behavior: "credential-stuffing", scope_attested: false }),
  );
  assert.deepEqual(conflict.uncertainties, ["purpose-behavior-conflict"]);
});

test("normalized events reject extra fields, coercion, payloads, and identity", () => {
  const invalid = [
    null,
    [],
    { ...DEFAULT_KARMA_EVENT, payload: "never accepted" },
    { ...DEFAULT_KARMA_EVENT, identity: "never accepted" },
    { ...DEFAULT_KARMA_EVENT, schema: "karma.mirror/event-v2" },
    { ...DEFAULT_KARMA_EVENT, behavior: "unknown" },
    { ...DEFAULT_KARMA_EVENT, repetition: 0 },
    { ...DEFAULT_KARMA_EVENT, repetition: 9 },
    { ...DEFAULT_KARMA_EVENT, repetition: 1.5 },
    { ...DEFAULT_KARMA_EVENT, repetition: "4" },
    { ...DEFAULT_KARMA_EVENT, boundary_crossings: -1 },
    { ...DEFAULT_KARMA_EVENT, boundary_crossings: 4 },
    { ...DEFAULT_KARMA_EVENT, requested_effect: "shell" },
    { ...DEFAULT_KARMA_EVENT, declared_purpose: "certain" },
    { ...DEFAULT_KARMA_EVENT, scope_attested: 1 },
    { ...DEFAULT_KARMA_EVENT, evidence_complete: "true" },
  ];
  const { behavior: _removed, ...missing } = DEFAULT_KARMA_EVENT;
  invalid.push(missing);

  for (const value of invalid) {
    assert.throws(() => normalizeKarmaEvent(value), KarmaMirrorError);
  }
});

test("receipt vocabulary is fixed, advisory, and contains no ambient identity", () => {
  const receipt = createKarmaReceipt(DEFAULT_KARMA_EVENT);
  assert.equal(receipt.schema, KARMA_RECEIPT_SCHEMA);
  assert.equal(KARMA_EVENT_SCHEMA, "karma.mirror/event-v1");
  assert.deepEqual(receipt.virtues, KARMA_VIRTUES);
  assert.deepEqual(receipt.non_claims, KARMA_NON_CLAIMS);
  assert.equal("level" in receipt, false);
  assert.equal("identity" in receipt, false);
  assert.equal("intent" in receipt, false);
  assert.equal("timestamp" in receipt, false);
  assert.equal("request_id" in receipt, false);
  assert.equal(canonicalKarmaJson(receipt), canonicalKarmaJson(receipt));
  assert.match(canonicalKarmaJson(receipt), /^\{"action_executed":false,/);
  assert.throws(() => canonicalKarmaJson({ value: Number.NaN }), KarmaMirrorError);
});
