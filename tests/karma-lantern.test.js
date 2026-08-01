import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  LANTERN_ACTION_SCHEMA,
  LANTERN_BRIEF_FIELDS,
  LANTERN_BRIEF_SCHEMA,
  LANTERN_FALSE_BOUNDARIES,
  LANTERN_LEARNING_SCHEMA,
  LANTERN_LEXICON,
  LANTERN_NON_CLAIMS,
  LANTERN_REVIEWED_DIGESTS,
  LANTERN_TRUE_BOUNDARIES,
  LANTERN_TRUTH_SCHEMA,
  EXPECTED_CLOUDBELL_CANONICAL_SHA256,
  EXPECTED_HATSU_CANONICAL_SHA256,
  EXPECTED_LANTERN_CANONICAL_SHA256,
  canonicalSemanticSha256,
  createKarmaLanternBrief,
  validateKarmaLanternBrief,
  validateLanternLexicon,
} from "../lib/karma-lantern.js";
import { createCloudbellCard } from "../lib/cloudbell-herald.js";
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
  new URL("../fixtures/lantern.json", import.meta.url),
);
const FIXTURE_BYTES = await readFile(
  new URL("../fixtures/lantern-brief.json", import.meta.url),
);
const FIXTURES = JSON.parse(FIXTURE_BYTES.toString("utf8"));
const LEXICON_SHA256 =
  "528dab807ef6e624524c5f75b093ad7cc1585240457cbdaff4b62968e05179da";
const FIXTURE_SHA256 =
  "fbc035d89acd149f568a82aa85afc6d60a0d82e4ea54b2ca155e0f527bc12f5a";
const ENVELOPE_SHA256 =
  "fbbc221ae65b5b5c7518b7542b8257b2162ec31212929a86451324419219fda2";

function event(overrides = {}) {
  return { ...DEFAULT_KARMA_EVENT, ...overrides };
}

test("frozen KINGDOM bytes and all nine Lantern briefs match exactly", () => {
  assert.equal(
    createHash("sha256").update(LEXICON_BYTES).digest("hex"),
    LEXICON_SHA256,
  );
  assert.equal(
    createHash("sha256").update(FIXTURE_BYTES).digest("hex"),
    FIXTURE_SHA256,
  );
  assert.equal(FIXTURES.schema, "karma.lantern/fixtures-v1");
  assert.equal(FIXTURES.cases.length, 9);

  for (const fixture of FIXTURES.cases) {
    const first = createKarmaLanternBrief(fixture.event);
    const second = createKarmaLanternBrief(fixture.event);
    assert.deepEqual(first, fixture.expected, fixture.id);
    assert.deepEqual(second, first, `${fixture.id} must be deterministic`);
    assert.deepEqual(Object.keys(first), LANTERN_BRIEF_FIELDS);
    assert.equal(Object.isFrozen(first), true);
    assert.equal(Object.isFrozen(first.truth_receipt), true);
    assert.equal(Object.isFrozen(first.action_card.options), true);
    assert.equal(Object.isFrozen(first.learning_seed.replay_event), true);
  }
});

test("the Vow budget and finite six-step legibility rail remain bounded", () => {
  assert.equal(LANTERN_LEXICON.ability.id, "karma.lantern.v1");
  assert.equal(LANTERN_LEXICON.ability.name, "KARMA Lantern · 業環明燈");
  assert.deepEqual(LANTERN_LEXICON.ability.affinity, {
    primary: "Conjuration",
    secondary: "Transmutation",
  });
  assert.deepEqual(LANTERN_LEXICON.ability.budget, {
    briefs_per_event: 1,
    response_options_per_stage: 3,
    causal_steps: 6,
    network_calls: 0,
    storage_writes: 0,
    external_actions: 0,
  });
  const brief = createKarmaLanternBrief(DEFAULT_KARMA_EVENT);
  assert.equal(brief.schema, LANTERN_BRIEF_SCHEMA);
  assert.equal(brief.truth_receipt.schema, LANTERN_TRUTH_SCHEMA);
  assert.equal(brief.action_card.schema, LANTERN_ACTION_SCHEMA);
  assert.equal(brief.learning_seed.schema, LANTERN_LEARNING_SCHEMA);
  assert.deepEqual(
    brief.causal_rail.map(({ id }) => id),
    ["normalize", "separate", "interpret", "explain", "respond", "learn"],
  );
  assert.deepEqual(
    brief.causal_rail.map(({ state }) => state),
    ["available", "available", "available", "available", "proposed", "open"],
  );
  assert.deepEqual(LANTERN_REVIEWED_DIGESTS, {
    hatsu: EXPECTED_HATSU_CANONICAL_SHA256,
    cloudbell: EXPECTED_CLOUDBELL_CANONICAL_SHA256,
    lantern: EXPECTED_LANTERN_CANONICAL_SHA256,
  });
  assert.equal(
    canonicalSemanticSha256(LANTERN_LEXICON),
    EXPECTED_LANTERN_CANONICAL_SHA256,
  );
});

test("truth keeps normalized signals, declarations, policy trace, inferences, and unknowns separate", () => {
  const complete = createKarmaLanternBrief(DEFAULT_KARMA_EVENT);
  const ambiguous = createKarmaLanternBrief(event({
    behavior: "injection",
    declared_purpose: "ambiguous",
    scope_attested: false,
  }));
  const incomplete = createKarmaLanternBrief(event({
    behavior: "injection",
    declared_purpose: "ambiguous",
    scope_attested: false,
    evidence_complete: false,
  }));

  assert.equal(
    complete.truth_receipt.epistemic_id,
    "karma.epistemic.declared-complete.v1",
  );
  assert.equal(
    ambiguous.truth_receipt.epistemic_id,
    "karma.epistemic.declared-ambiguous.v1",
  );
  assert.equal(
    incomplete.truth_receipt.epistemic_id,
    "karma.epistemic.declared-incomplete.v1",
  );
  assert.equal(ambiguous.source_stage, "observe");
  assert.deepEqual(Object.keys(complete.truth_receipt.normalized_signals), [
    "behavior", "repetition", "boundary_crossings", "requested_effect",
  ]);
  assert.deepEqual(Object.keys(complete.truth_receipt.declarations), [
    "declared_purpose", "scope_attested", "evidence_complete",
  ]);
  assert.equal(complete.truth_receipt.policy_inferences.length, 2);
  assert.ok(complete.truth_receipt.policy_trace.length >= 2);
  assert.equal(complete.truth_receipt.explicit_unknowns.length, 4);
  assert.match(complete.truth_receipt.provenance, /(?:receives|has) no raw source/i);
});

test("supplied KARMA and Cloudbell artifacts must match canonical recomputation", () => {
  const receipt = createKarmaReceipt(DEFAULT_KARMA_EVENT);
  const card = createCloudbellCard(DEFAULT_KARMA_EVENT, receipt);
  assert.equal(
    createKarmaLanternBrief(DEFAULT_KARMA_EVENT, receipt, card).source_stage,
    "allow",
  );

  const otherEvent = event({
    behavior: "injection",
    declared_purpose: "exploitative",
    scope_attested: false,
  });
  const otherReceipt = createKarmaReceipt(otherEvent);
  const otherCard = createCloudbellCard(otherEvent, otherReceipt);
  assert.throws(
    () => createKarmaLanternBrief(otherEvent, receipt, otherCard),
    /supplied KARMA receipt does not match/,
  );
  assert.throws(
    () => createKarmaLanternBrief(otherEvent, otherReceipt, card),
    /supplied Cloudbell card does not match/,
  );
});

test("every Action Card proposes exactly three reversible options and exact recovery", () => {
  for (const fixture of FIXTURES.cases) {
    const receipt = createKarmaReceipt(fixture.event);
    const { action_card: action, recovery } = createKarmaLanternBrief(fixture.event);
    assert.equal(action.options.length, 3, fixture.id);
    assert.equal(action.options.every(({ reversible }) => reversible === true), true);
    assert.equal(action.recovery, receipt.recovery);
    assert.equal(recovery, receipt.recovery);
    assert.equal(action.reversible_only, true);
    assert.equal(action.human_decision_required, true);
    assert.equal(action.options_proposed_only, true);
    assert.equal(action.action_executed, false);
    assert.equal(action.authority_granted, false);
    assert.equal(action.policy_values_advisory_only, true);
    assert.match(action.review_priority_explanation, /\S/);
  }
  assert.match(LANTERN_NON_CLAIMS[2], /not clocks, queue positions/i);
});

test("Learning Seeds replay normalized events and automate or retain nothing", () => {
  const input = event({
    behavior: "traversal-ssrf",
    repetition: 8,
    boundary_crossings: 3,
    requested_effect: "external",
    declared_purpose: "exploitative",
    scope_attested: false,
  });
  const brief = createKarmaLanternBrief(input);
  const seed = brief.learning_seed;
  assert.deepEqual(seed.replay_event, input);
  assert.equal(seed.closure_requirements.length, 4);
  assert.equal(seed.closure_status, "open");
  assert.equal(seed.future_use, "candidate-design-input");
  assert.equal(seed.automatic_test_creation, false);
  assert.equal(seed.automatic_policy_mutation, false);
  assert.equal(seed.persistent_storage, false);
  assert.deepEqual(brief.non_claims, LANTERN_NON_CLAIMS);
  for (const field of LANTERN_TRUE_BOUNDARIES) assert.equal(brief[field], true, field);
  for (const field of LANTERN_FALSE_BOUNDARIES) assert.equal(brief[field], false, field);
});

test("novel input, mutated lexicons, and mutated briefs fail closed", () => {
  assert.throws(
    () => createKarmaLanternBrief({ ...DEFAULT_KARMA_EVENT, payload: "never" }),
    KarmaMirrorError,
  );
  assert.throws(() => createKarmaLanternBrief(null), KarmaMirrorError);

  const brief = createKarmaLanternBrief(DEFAULT_KARMA_EVENT);
  const mutations = [
    { ...brief, automatic_response: true },
    { ...brief, identity: "never accepted" },
    Object.fromEntries(Object.entries(brief).filter(([key]) => key !== "recovery")),
    {
      ...brief,
      action_card: {
        ...brief.action_card,
        options: brief.action_card.options.map((option, index) =>
          index === 0 ? { ...option, reversible: false } : option),
      },
    },
    {
      ...brief,
      learning_seed: {
        ...brief.learning_seed,
        replay_event: { ...brief.learning_seed.replay_event, payload: "never" },
      },
    },
  ];
  for (const mutation of mutations) {
    assert.throws(() => validateKarmaLanternBrief(mutation), KarmaMirrorError);
  }

  const lexicon = JSON.parse(LEXICON_BYTES.toString("utf8"));
  lexicon.boundaries.raw_payload_input = true;
  assert.throws(() => validateLanternLexicon(lexicon), KarmaMirrorError);
  const widened = JSON.parse(LEXICON_BYTES.toString("utf8"));
  widened.stages.allow.response_options.push({
    id: "widen", label: "Widen", reason: "Novel authority", reversible: true,
  });
  assert.throws(() => validateLanternLexicon(widened), KarmaMirrorError);
  const textOnlyMutation = JSON.parse(LEXICON_BYTES.toString("utf8"));
  textOnlyMutation.stages.allow.response_options[0].reason =
    "A structurally valid sentence that is outside the reviewed semantic digest.";
  assert.throws(
    () => validateLanternLexicon(textOnlyMutation),
    /differs from the reviewed contract/,
  );
});

test("the complete 15,360-event domain stays finite, inert, and replayable", () => {
  const epistemicIds = new Set(
    Object.values(LANTERN_LEXICON.epistemic_states).map(({ id }) => id),
  );
  const envelopeHash = createHash("sha256");
  let cases = 0;
  for (const { id: behavior } of KARMA_BEHAVIORS) {
    for (let repetition = 1; repetition <= 8; repetition += 1) {
      for (let boundary_crossings = 0; boundary_crossings <= 3; boundary_crossings += 1) {
        for (const requested_effect of KARMA_EFFECTS) {
          for (const declared_purpose of KARMA_PURPOSES) {
            for (const scope_attested of [false, true]) {
              for (const evidence_complete of [false, true]) {
                const input = {
                  schema: DEFAULT_KARMA_EVENT.schema,
                  behavior,
                  repetition,
                  boundary_crossings,
                  requested_effect,
                  declared_purpose,
                  scope_attested,
                  evidence_complete,
                };
                const receipt = createKarmaReceipt(input);
                const cloudbell = createCloudbellCard(input, receipt);
                const brief = createKarmaLanternBrief(input, receipt, cloudbell);
                assert.equal(epistemicIds.has(brief.truth_receipt.epistemic_id), true);
                assert.equal(KARMA_STAGES.includes(brief.source_stage), true);
                assert.equal(brief.action_card.options.length, 3);
                assert.equal(brief.action_card.options.every(({ reversible }) => reversible), true);
                assert.deepEqual(brief.learning_seed.replay_event, input);
                assert.equal(brief.action_executed, false);
                assert.equal(brief.authority_granted, false);
                envelopeHash.update(canonicalKarmaJson({
                  event: input,
                  receipt,
                  cloudbell,
                  lantern: brief,
                }));
                cases += 1;
              }
            }
          }
        }
      }
    }
  }
  assert.equal(cases, 15_360);
  assert.equal(envelopeHash.digest("hex"), ENVELOPE_SHA256);
});
