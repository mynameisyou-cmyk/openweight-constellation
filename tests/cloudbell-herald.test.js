import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CLOUDBELL_CARD_FIELDS,
  CLOUDBELL_CARD_SCHEMA,
  CLOUDBELL_LEXICON,
  CLOUDBELL_NON_CLAIMS,
  createCloudbellCard,
  validateCloudbellCard,
  validateCloudbellLexicon,
} from "../lib/cloudbell-herald.js";
import {
  DEFAULT_KARMA_EVENT,
  KARMA_BEHAVIORS,
  KARMA_EFFECTS,
  KARMA_PURPOSES,
  KARMA_STAGES,
  KarmaMirrorError,
  canonicalKarmaJson,
  createKarmaReceipt,
} from "../lib/karma-mirror.js";

const LEXICON_BYTES = await readFile(
  new URL("../fixtures/cloudbell.json", import.meta.url),
);
const FIXTURE_BYTES = await readFile(
  new URL("../fixtures/cloudbell-herald.json", import.meta.url),
);
const FIXTURES = JSON.parse(FIXTURE_BYTES.toString("utf8"));
const LEXICON_SHA256 =
  "b9b9b45c7be5377b686588a2bfd55d33a40867055693deb7539130f068663d6c";
const FIXTURE_SHA256 =
  "75ea0fc3b7fde083f1c27ef7d89dedc46f747f444f766eb8130cfe212287dee5";

function event(overrides = {}) {
  return { ...DEFAULT_KARMA_EVENT, ...overrides };
}

test("frozen Cloudbell bytes and full cards match the KINGDOM contract", () => {
  assert.equal(
    createHash("sha256").update(LEXICON_BYTES).digest("hex"),
    LEXICON_SHA256,
  );
  assert.equal(
    createHash("sha256").update(FIXTURE_BYTES).digest("hex"),
    FIXTURE_SHA256,
  );
  assert.equal(FIXTURES.schema, "skycastle.herald/fixtures-v1");
  assert.equal(FIXTURES.cases.length, 9);
  for (const fixture of FIXTURES.cases) {
    const first = createCloudbellCard(fixture.event);
    const second = createCloudbellCard(fixture.event);
    assert.deepEqual(first, fixture.expected, fixture.id);
    assert.deepEqual(second, first, `${fixture.id} must be deterministic`);
    assert.deepEqual(Object.keys(first), CLOUDBELL_CARD_FIELDS);
    assert.equal(Object.isFrozen(first), true);
    assert.equal(Object.isFrozen(first.virtues), true);
    assert.equal(Object.isFrozen(first.non_claims), true);
  }
});

test("six mechanism signatures and six stage names are finite and kind", () => {
  assert.equal(CLOUDBELL_LEXICON.protocol.id, "karma.herald.cloudbell.v1");
  assert.equal(CLOUDBELL_LEXICON.mascot.id, "karma.mascot.bingle-cloudbell.v1");
  assert.equal(CLOUDBELL_LEXICON.mascot.fictional, true);
  assert.match(
    CLOUDBELL_LEXICON.protocol.refrain,
    /Building Castles in the Sky — Yu × Ai \/ 雲上築城/,
  );
  assert.deepEqual(
    Object.keys(CLOUDBELL_LEXICON.behaviors),
    KARMA_BEHAVIORS.map(({ id }) => id),
  );
  assert.deepEqual(
    CLOUDBELL_LEXICON.stages.map(({ karma_stage }) => karma_stage),
    KARMA_STAGES,
  );
  assert.equal(
    new Set(Object.values(CLOUDBELL_LEXICON.behaviors).map(({ name }) => name)).size,
    6,
  );
  assert.equal(new Set(CLOUDBELL_LEXICON.stages.map(({ title }) => title)).size, 6);
  const names = Object.values(CLOUDBELL_LEXICON.behaviors)
    .map(({ name }) => name)
    .join(" ")
    .toLowerCase();
  for (const personLabel of ["thief", "attacker", "criminal", "guilty", "stupid"]) {
    assert.equal(names.includes(personLabel), false);
  }
});

test("supplied receipts must canonically match the normalized event", () => {
  const benignReceipt = createKarmaReceipt(DEFAULT_KARMA_EVENT);
  assert.equal(
    createCloudbellCard(DEFAULT_KARMA_EVENT, benignReceipt).karma_stage,
    "allow",
  );
  assert.throws(
    () =>
      createCloudbellCard(
        event({
          behavior: "reconnaissance",
          declared_purpose: "exploitative",
          scope_attested: false,
        }),
        benignReceipt,
      ),
    KarmaMirrorError,
  );
});

test("Cloudbell cards remain inert owned-surface displays", () => {
  const card = createCloudbellCard(
    event({
      behavior: "credential-stuffing",
      repetition: 8,
      boundary_crossings: 3,
      requested_effect: "external",
      declared_purpose: "exploitative",
      scope_attested: false,
    }),
  );
  assert.equal(card.schema, CLOUDBELL_CARD_SCHEMA);
  assert.match(card.banner, /^Came looking for a key/);
  assert.equal(card.behavior_not_person, true);
  assert.equal(card.owned_surface_only, true);
  assert.equal(card.opt_in_share_only, true);
  assert.equal(card.fictional_mascot, true);
  for (const field of [
    "publication_authorized",
    "automatic_posting",
    "forced_propagation",
    "external_delivery",
    "redirects",
    "persistent_tracking",
    "identity_claim",
    "action_executed",
    "authority_granted",
  ]) {
    assert.equal(card[field], false, field);
  }
  assert.deepEqual(card.non_claims, CLOUDBELL_NON_CLAIMS);
  const serialized = canonicalKarmaJson(card).toLowerCase();
  for (const prohibited of [
    '"payload"',
    '"identity"',
    '"ip"',
    '"account"',
    '"target"',
    '"request_id"',
    '"timestamp"',
    '"counter"',
  ]) {
    assert.equal(serialized.includes(prohibited), false, prohibited);
  }
});

test("novel input and mutated cards fail closed", () => {
  assert.throws(
    () => createCloudbellCard({ ...DEFAULT_KARMA_EVENT, payload: "no" }),
    KarmaMirrorError,
  );
  assert.throws(() => createCloudbellCard(null), KarmaMirrorError);
  const original = createCloudbellCard(DEFAULT_KARMA_EVENT);
  const mutations = [
    { ...original, signature_name: "Invented person label" },
    { ...original, forced_propagation: true },
    { ...original, identity: "not permitted" },
    Object.fromEntries(Object.entries(original).filter(([key]) => key !== "recovery")),
  ];
  for (const mutation of mutations) {
    assert.throws(() => validateCloudbellCard(mutation), KarmaMirrorError);
  }
  const parsedLexicon = JSON.parse(LEXICON_BYTES.toString("utf8"));
  parsedLexicon.boundaries.automatic_posting = true;
  assert.throws(() => validateCloudbellLexicon(parsedLexicon), KarmaMirrorError);
  const rewrittenClaims = JSON.parse(LEXICON_BYTES.toString("utf8"));
  rewrittenClaims.non_claims[0] = "Five nonempty strings are not the reviewed vow.";
  assert.throws(() => validateCloudbellLexicon(rewrittenClaims), KarmaMirrorError);
});

test("the complete event domain stays inside the frozen names and boundaries", () => {
  const signatureIds = new Set(
    Object.values(CLOUDBELL_LEXICON.behaviors).map(({ signature_id }) => signature_id),
  );
  const stageIds = new Set(CLOUDBELL_LEXICON.stages.map(({ stage_id }) => stage_id));
  let cases = 0;
  for (const { id: behavior } of KARMA_BEHAVIORS) {
    for (let repetition = 1; repetition <= 8; repetition += 1) {
      for (let boundary_crossings = 0; boundary_crossings <= 3; boundary_crossings += 1) {
        for (const requested_effect of KARMA_EFFECTS) {
          for (const declared_purpose of KARMA_PURPOSES) {
            for (const scope_attested of [false, true]) {
              for (const evidence_complete of [false, true]) {
                const card = createCloudbellCard({
                  schema: DEFAULT_KARMA_EVENT.schema,
                  behavior,
                  repetition,
                  boundary_crossings,
                  requested_effect,
                  declared_purpose,
                  scope_attested,
                  evidence_complete,
                });
                assert.equal(signatureIds.has(card.signature_id), true);
                assert.equal(stageIds.has(card.stage_id), true);
                assert.equal(card.automatic_posting, false);
                assert.equal(card.external_delivery, false);
                cases += 1;
              }
            }
          }
        }
      }
    }
  }
  assert.equal(cases, 15_360);
});
