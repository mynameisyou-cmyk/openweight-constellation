import lanternLexicon from "../fixtures/lantern.json" with { type: "json" };

import {
  KARMA_NON_CLAIMS,
  KARMA_BEHAVIORS,
  KARMA_EFFECTS,
  KARMA_EVENT_SCHEMA,
  KARMA_PURPOSES,
  KARMA_RECEIPT_SCHEMA,
  KARMA_STAGES,
  KARMA_VIRTUES,
  KarmaMirrorError,
  canonicalKarmaJson,
  createKarmaReceipt,
  normalizeKarmaEvent,
} from "./karma-mirror.js";
import {
  CLOUDBELL_CARD_SCHEMA,
  CLOUDBELL_LEXICON,
  createCloudbellCard,
  validateCloudbellCard,
} from "./cloudbell-herald.js";

export const LANTERN_LEXICON_SCHEMA = "karma.lantern/lexicon-v1";
export const LANTERN_BRIEF_SCHEMA = "karma.lantern/brief-v1";
export const LANTERN_TRUTH_SCHEMA = "karma.lantern/truth-receipt-v1";
export const LANTERN_ACTION_SCHEMA = "karma.lantern/action-card-v1";
export const LANTERN_LEARNING_SCHEMA = "karma.lantern/learning-seed-v1";

export const EXPECTED_HATSU_CANONICAL_SHA256 =
  "9684d491b6dfdab20612b4340d0caef9fd8676e0c8b14c2e7421cc73da1944c9";
export const EXPECTED_CLOUDBELL_CANONICAL_SHA256 =
  "aa7b5a42d45b56b8fb1be6e8f0ec68080e490c1f1eb6b20b584f78b4f6b57a49";
export const EXPECTED_LANTERN_CANONICAL_SHA256 =
  "39e0443b3f6f03f4bd7c76421df9d1fb2a986ad6d77264813a0e3c392e763a13";

const REVIEWED_HATSU = JSON.parse("{\"affinity\":{\"cost\":\"The ability gives up payloads, identity, persistence, network access, retaliation, and production authority.\",\"primary\":\"Manipulation\",\"secondary\":\"Conjuration\"},\"anti_triggers\":[\"raw payload text or executable content\",\"a request to identify, rank, punish, exploit, or retaliate against a person or external system\",\"live traffic enforcement, remote probing, credential use, or production mutation\",\"missing, ambiguous, or unreviewed event fields\"],\"boundaries\":{\"automatic_activation\":false,\"external_effects\":false,\"hack_back\":false,\"identity_processing\":false,\"network_calls\":false,\"payload_execution\":false,\"payload_input\":false,\"persistent_reputation\":false,\"person_scoring\":false,\"production_enforcement\":false,\"storage\":false},\"breach_response\":\"Reject malformed or novel input, execute nothing, disclose the unmet condition, and require a fresh reviewed contract.\",\"budget\":{\"events_per_interpretation\":1,\"external_effects\":0,\"maximum_boundary_crossings\":3,\"maximum_repetition\":8,\"maximum_stage\":5,\"network_calls\":0,\"storage_writes\":0},\"conditions\":[\"The event describes observable request behavior, never identity or permanent reputation.\",\"Declared purpose cannot increase severity or prove intent.\",\"Incomplete or ambiguous evidence caps the response at observe.\",\"Attested research scope caps the response at constrain.\",\"Synthetic self-scope is inert: no vulnerable service, payload execution, credentials, storage, network, or egress.\"],\"contract\":{\"authority\":\"none\",\"execution\":false,\"input\":\"One strict karma.mirror/event-v1 object with finite enums and bounded integers.\",\"output\":\"One deterministic karma.mirror/receipt-v1 advisory receipt.\"},\"desire\":\"Let adversarial behavior reduce only its own request-scoped capability while constructive and research behavior retain a reversible path to reality.\",\"exit\":\"Return one stateless receipt and retain no event, identifier, score, process, timer, hook, or continuation.\",\"limitations\":[\"Exactly six traditional behavior presets and six advisory stages.\",\"Exactly one stage per receipt.\",\"No model inference, free text, raw payload, clock, randomness, sleep, proof-of-work, identifier, or external lookup.\",\"No automatic action, enforcement, deployment, or continuation.\"],\"name\":\"KARMA Mirror · 自照業環\",\"non_claims\":[\"A synthetic route is a visualization contract, not a deployed honeypot or vulnerable system.\",\"Behavior evidence does not establish a person's purpose, guilt, identity, or worth.\",\"Attenuation is advisory and request-scoped; it neither punishes nor grants authority.\",\"This prototype does not establish production security, legality, safety, or effectiveness.\"],\"policy\":{\"behaviors\":{\"benign\":0,\"credential-stuffing\":3,\"injection\":4,\"reconnaissance\":1,\"scraping-resource-abuse\":2,\"traversal-ssrf\":4},\"declared_purposes\":[\"constructive\",\"research\",\"ambiguous\",\"exploitative\"],\"event_schema\":\"karma.mirror/event-v1\",\"non_claims\":[\"This receipt is not hack-back and authorizes no action against another system.\",\"It evaluates one normalized event, not a person's identity, intent, guilt, worth, or reputation.\",\"Friction and routing are advisory display values, not production enforcement.\",\"No payload, command, network call, credential, storage write, or vulnerable service was executed.\",\"This receipt grants no authority, safety guarantee, legal conclusion, or completion claim.\"],\"receipt_schema\":\"karma.mirror/receipt-v1\",\"requested_effects\":[\"observe\",\"read\",\"write\",\"execute\",\"external\"],\"stages\":[{\"friction_units\":0,\"level\":0,\"real_capability_percent\":100,\"recovery\":\"Ordinary safeguards remain; no capability attenuation is proposed.\",\"route\":\"real\",\"stage\":\"allow\",\"ttl_steps\":0},{\"friction_units\":1,\"level\":1,\"real_capability_percent\":80,\"recovery\":\"One clean request step returns this request scope to ordinary handling.\",\"route\":\"real\",\"stage\":\"observe\",\"ttl_steps\":1},{\"friction_units\":2,\"level\":2,\"real_capability_percent\":50,\"recovery\":\"Two clean request steps or explicit review restore ordinary capability.\",\"route\":\"constrained\",\"stage\":\"constrain\",\"ttl_steps\":2},{\"friction_units\":3,\"level\":3,\"real_capability_percent\":20,\"recovery\":\"Three clean request steps or explicit review remove display-only friction.\",\"route\":\"constrained\",\"stage\":\"challenge\",\"ttl_steps\":3},{\"friction_units\":4,\"level\":4,\"real_capability_percent\":0,\"recovery\":\"Four clean request steps or explicit review exit the inert synthetic self-scope.\",\"route\":\"synthetic-self-scope\",\"stage\":\"shadow\",\"ttl_steps\":4},{\"friction_units\":5,\"level\":5,\"real_capability_percent\":0,\"recovery\":\"Fresh explicit review is required before real capability can return.\",\"route\":\"none\",\"stage\":\"quarantine\",\"ttl_steps\":5}],\"virtues\":[\"honesty\",\"beauty\",\"collaboration\",\"understanding\",\"constructive mutual benefit\"]},\"proof\":[\"strict-schema rejection tests\",\"fixture receipts pinned across Python and browser JavaScript\",\"ambiguity and research cap invariants\",\"monotonic capability attenuation tests\",\"source checks for network, process, storage, identity, and payload seams\"],\"schema\":\"karma.mirror/hatsu-v1\",\"trigger\":\"An explicitly normalized, request-scoped behavior event is submitted to the local interpreter.\"}");

const LEXICON_FIELDS = Object.freeze([
  "schema", "ability", "epistemic_states", "review_roles",
  "review_priorities", "causal_steps", "policy_trace_glossary",
  "uncertainty_glossary", "explicit_unknowns", "behaviors", "stages",
  "human_escalation_prompts", "closure_requirements", "provenance",
  "non_claims", "boundaries",
]);
const ABILITY_FIELDS = Object.freeze([
  "id", "name", "desire", "affinity", "trigger", "anti_trigger",
  "input_output", "conditions", "limitations", "budget",
  "breach_response", "proof", "exit",
]);
const AFFINITY_FIELDS = Object.freeze(["primary", "secondary"]);
const BUDGET_FIELDS = Object.freeze([
  "briefs_per_event", "response_options_per_stage", "causal_steps",
  "network_calls", "storage_writes", "external_actions",
]);
const NAMED_EXPLANATION_FIELDS = Object.freeze(["id", "title", "explanation"]);
const ROLE_FIELDS = Object.freeze(["id", "title", "description"]);
const CAUSAL_STEP_FIELDS = Object.freeze(["id", "title", "description", "state"]);
const BEHAVIOR_FIELDS = Object.freeze([
  "headline", "learning_target", "architecture_question",
]);
const STAGE_FIELDS = Object.freeze([
  "review_role", "review_priority", "explanation", "response_options",
]);
const OPTION_FIELDS = Object.freeze(["id", "label", "reason", "reversible"]);
const TRUTH_FIELDS = Object.freeze([
  "schema", "epistemic_id", "epistemic_title", "epistemic_explanation",
  "normalized_signals", "declarations", "policy_trace",
  "policy_inferences", "uncertainties", "explicit_unknowns", "provenance",
]);
const SIGNAL_FIELDS = Object.freeze([
  "behavior", "repetition", "boundary_crossings", "requested_effect",
]);
const DECLARATION_FIELDS = Object.freeze([
  "declared_purpose", "scope_attested", "evidence_complete",
]);
const GLOSS_FIELDS = Object.freeze(["token", "explanation"]);
const INFERENCE_FIELDS = Object.freeze(["kind", "id", "explanation"]);
const ACTION_FIELDS = Object.freeze([
  "schema", "suggested_review_role_id", "suggested_review_role_title",
  "review_priority_id", "review_priority_title", "review_priority_explanation",
  "policy_stage", "advisory_route", "advisory_capability_percent",
  "display_friction_units", "advisory_recovery_steps",
  "policy_values_advisory_only", "options", "human_escalation_prompts",
  "recovery", "reversible_only",
  "human_decision_required", "options_proposed_only", "action_executed",
  "authority_granted",
]);
const LEARNING_FIELDS = Object.freeze([
  "schema", "lesson_class_id", "replay_event", "regression_targets",
  "architecture_questions", "closure_requirements", "closure_status",
  "future_use", "automatic_test_creation", "automatic_policy_mutation",
  "persistent_storage",
]);

export const LANTERN_TRUE_BOUNDARIES = Object.freeze([
  "behavior_not_person", "explanatory_only", "owned_surface_only",
  "reversible_options_only", "human_decision_required",
  "replay_event_normalized_only", "no_time_guarantee",
  "policy_values_advisory_only",
]);
export const LANTERN_FALSE_BOUNDARIES = Object.freeze([
  "live_ingestion", "raw_payload_input", "identity_processing",
  "person_attribution", "persistent_incident_store", "automatic_response",
  "automatic_escalation", "automatic_test_creation",
  "automatic_policy_mutation", "production_monitoring", "network_calls",
  "storage_writes", "external_delivery", "publication_authorized",
  "action_executed", "authority_granted",
]);
export const LANTERN_BRIEF_FIELDS = Object.freeze([
  "schema", "ability_id", "ability_name", "source_event_schema",
  "source_receipt_schema", "source_cloudbell_schema", "source_behavior",
  "source_signature_id", "source_stage", "headline", "mechanism",
  "truth_receipt", "action_card", "learning_seed", "causal_rail", "virtues",
  "recovery", ...LANTERN_TRUE_BOUNDARIES, ...LANTERN_FALSE_BOUNDARIES,
  "non_claims",
]);

const EPISTEMIC_KEYS = Object.freeze([
  "declared-complete", "declared-ambiguous", "declared-incomplete",
]);
const ROLE_KEYS = Object.freeze([
  "service-steward", "security-reviewer", "incident-coordinator",
]);
const PRIORITY_KEYS = Object.freeze([
  "routine", "heightened", "critical-human",
]);
const CAUSAL_IDS = Object.freeze([
  "normalize", "separate", "interpret", "explain", "respond", "learn",
]);
const CAUSAL_STATES = Object.freeze([
  "available", "available", "available", "available", "proposed", "open",
]);
const UNCERTAINTY_TOKENS = Object.freeze([
  "incomplete-evidence", "declared-purpose-ambiguous",
  "research-scope-unverified", "purpose-behavior-conflict",
]);
export const LANTERN_NON_CLAIMS = Object.freeze([
  "This brief explains one normalized event and does not prove that a real incident occurred.",
  "It names a behavior pattern, never a person, identity, intent, guilt, worth, affiliation, or reputation.",
  "Its review priorities are posture labels, not clocks, queue positions, elapsed-time measurements, or guarantees.",
  "Its stage, route, capability, friction, and recovery-step values are advisory displays, not evidence that enforcement happened.",
  "Its options are inert proposals and authorize or execute no infrastructure action.",
  "Its replay and learning fields create no stored incident, test, ticket, policy change, or external message.",
  "It provides no monitoring coverage, prevention claim, security guarantee, legal conclusion, or completion claim.",
]);

function assertExactFields(value, expected, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new KarmaMirrorError(`${label} must be an object`);
  }
  const keys = Object.keys(value);
  const missing = expected.filter((field) => !(field in value));
  const extra = keys.filter((field) => !expected.includes(field));
  if (missing.length > 0 || extra.length > 0 || keys.length !== expected.length) {
    throw new KarmaMirrorError(
      `${label} fields differ; missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`,
    );
  }
}

function assertText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new KarmaMirrorError(`${label} must be non-empty text`);
  }
}

function assertTextList(value, count, label) {
  if (!Array.isArray(value) || value.length !== count) {
    throw new KarmaMirrorError(`${label} must contain exactly ${count} items`);
  }
  value.forEach((item) => assertText(item, `${label} item`));
}

function assertObjectList(value, minimum, maximum, fields, label) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    const qualifier = minimum === maximum ? `exactly ${minimum}` : `${minimum} to ${maximum}`;
    throw new KarmaMirrorError(`${label} must contain ${qualifier} objects`);
  }
  value.forEach((item, index) =>
    assertExactFields(item, fields, `${label} item ${index}`));
}

function arraysEqual(left, right) {
  return Array.isArray(left) && left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function sameSet(left, right) {
  return left.length === right.length && left.every((item) => right.includes(item));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

const SHA256_CONSTANTS = Object.freeze([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotateRight(value, places) {
  return (value >>> places) | (value << (32 - places));
}

function sha256Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bitLength = bytes.length * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const before15 = words[index - 15];
      const before2 = words[index - 2];
      const sigma0 = rotateRight(before15, 7) ^ rotateRight(before15, 18) ^ (before15 >>> 3);
      const sigma1 = rotateRight(before2, 17) ^ rotateRight(before2, 19) ^ (before2 >>> 10);
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temporary1 = (h + sum1 + choose + SHA256_CONSTANTS[index] + words[index]) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }
    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }
  return [...hash].map((word) => word.toString(16).padStart(8, "0")).join("");
}

export function canonicalSemanticSha256(value) {
  return sha256Utf8(canonicalKarmaJson(value));
}

function requireReviewedDigest(value, expected, label) {
  if (canonicalSemanticSha256(value) !== expected) {
    throw new KarmaMirrorError(`${label} differs from the reviewed contract`);
  }
}

function expectedPolicyTraceTokens() {
  return [
    ...KARMA_BEHAVIORS.map(({ id }) => `behavior:${id}`),
    ...[0, 1, 2, 3, 4].map((baseline) => `baseline:${baseline}`),
    "repeated-pattern", "repeated-boundary-crossing", "high-effect-request",
    "ambiguity-cap", "verified-research-cap",
  ];
}

function validateReviewedHatsu() {
  requireReviewedDigest(
    REVIEWED_HATSU,
    EXPECTED_HATSU_CANONICAL_SHA256,
    "KARMA Hatsu",
  );
  const policy = REVIEWED_HATSU.policy;
  const exactSequences = [
    [Object.keys(policy.behaviors).sort(), KARMA_BEHAVIORS.map(({ id }) => id).sort(), "behaviors"],
    [policy.requested_effects, KARMA_EFFECTS, "effects"],
    [policy.declared_purposes, KARMA_PURPOSES, "purposes"],
    [policy.stages.map(({ stage }) => stage), KARMA_STAGES, "stages"],
    [policy.virtues, KARMA_VIRTUES, "virtues"],
    [policy.non_claims, KARMA_NON_CLAIMS, "non-claims"],
  ];
  if (policy.event_schema !== KARMA_EVENT_SCHEMA ||
    policy.receipt_schema !== KARMA_RECEIPT_SCHEMA ||
    exactSequences.some(([actual, expected]) => !arraysEqual(actual, expected))) {
    throw new KarmaMirrorError("KARMA engine vocabulary differs from the reviewed Hatsu");
  }

  const levelEvents = [
    [0, "benign", 1],
    [1, "reconnaissance", 1],
    [2, "scraping-resource-abuse", 1],
    [3, "credential-stuffing", 1],
    [4, "injection", 1],
    [5, "traversal-ssrf", 4],
  ];
  for (const [level, behavior, repetition] of levelEvents) {
    const receipt = createKarmaReceipt({
      schema: KARMA_EVENT_SCHEMA,
      behavior,
      repetition,
      boundary_crossings: 0,
      requested_effect: "read",
      declared_purpose: behavior === "benign" ? "constructive" : "exploitative",
      scope_attested: behavior === "benign",
      evidence_complete: true,
    });
    const stage = policy.stages[level];
    for (const field of [
      "stage", "real_capability_percent", "friction_units", "route",
      "ttl_steps", "recovery",
    ]) {
      if (receipt[field] !== stage[field]) {
        throw new KarmaMirrorError(`KARMA engine ${field} differs from the reviewed Hatsu`);
      }
    }
  }
}

export function validateLanternLexicon(lexicon) {
  assertExactFields(lexicon, LEXICON_FIELDS, "Lantern lexicon");
  if (lexicon.schema !== LANTERN_LEXICON_SCHEMA) {
    throw new KarmaMirrorError("unexpected Lantern lexicon schema");
  }

  const ability = lexicon.ability;
  assertExactFields(ability, ABILITY_FIELDS, "Lantern ability");
  if (ability.id !== "karma.lantern.v1" || ability.name !== "KARMA Lantern · 業環明燈") {
    throw new KarmaMirrorError("Lantern ability identity changed");
  }
  for (const field of ABILITY_FIELDS.filter(
    (item) => !["affinity", "conditions", "limitations", "budget"].includes(item),
  )) assertText(ability[field], `Lantern ability ${field}`);
  assertExactFields(ability.affinity, AFFINITY_FIELDS, "Lantern affinity");
  if (canonicalKarmaJson(ability.affinity) !== canonicalKarmaJson({
    primary: "Conjuration", secondary: "Transmutation",
  })) throw new KarmaMirrorError("Lantern affinity changed");
  assertTextList(ability.conditions, 5, "Lantern conditions");
  assertTextList(ability.limitations, 6, "Lantern limitations");
  assertExactFields(ability.budget, BUDGET_FIELDS, "Lantern budget");
  if (canonicalKarmaJson(ability.budget) !== canonicalKarmaJson({
    briefs_per_event: 1,
    response_options_per_stage: 3,
    causal_steps: 6,
    network_calls: 0,
    storage_writes: 0,
    external_actions: 0,
  })) throw new KarmaMirrorError("Lantern budget changed");

  if (!arraysEqual(Object.keys(lexicon.epistemic_states), EPISTEMIC_KEYS)) {
    throw new KarmaMirrorError("Lantern epistemic states changed");
  }
  for (const key of EPISTEMIC_KEYS) {
    const state = lexicon.epistemic_states[key];
    assertExactFields(state, NAMED_EXPLANATION_FIELDS, `epistemic state ${key}`);
    if (state.id !== `karma.epistemic.${key}.v1`) {
      throw new KarmaMirrorError(`Lantern epistemic id changed for ${key}`);
    }
    NAMED_EXPLANATION_FIELDS.forEach((field) =>
      assertText(state[field], `epistemic state ${key} ${field}`));
  }

  if (!arraysEqual(Object.keys(lexicon.review_roles), ROLE_KEYS)) {
    throw new KarmaMirrorError("Lantern review roles changed");
  }
  for (const key of ROLE_KEYS) {
    const role = lexicon.review_roles[key];
    assertExactFields(role, ROLE_FIELDS, `Lantern role ${key}`);
    if (role.id !== `karma.role.${key}.v1`) {
      throw new KarmaMirrorError(`Lantern role id changed for ${key}`);
    }
    ROLE_FIELDS.forEach((field) => assertText(role[field], `Lantern role ${key} ${field}`));
  }

  if (!arraysEqual(Object.keys(lexicon.review_priorities), PRIORITY_KEYS)) {
    throw new KarmaMirrorError("Lantern review priorities changed");
  }
  for (const key of PRIORITY_KEYS) {
    const priority = lexicon.review_priorities[key];
    assertExactFields(
      priority,
      NAMED_EXPLANATION_FIELDS,
      `Lantern review priority ${key}`,
    );
    if (priority.id !== `karma.review-priority.${key}.v1`) {
      throw new KarmaMirrorError(`Lantern review priority id changed for ${key}`);
    }
    NAMED_EXPLANATION_FIELDS.forEach((field) =>
      assertText(priority[field], `Lantern review priority ${key} ${field}`));
  }

  if (!Array.isArray(lexicon.causal_steps) || lexicon.causal_steps.length !== 6) {
    throw new KarmaMirrorError("Lantern causal rail must contain six steps");
  }
  lexicon.causal_steps.forEach((step, index) => {
    assertExactFields(step, CAUSAL_STEP_FIELDS, `Lantern causal step ${index}`);
    if (step.id !== CAUSAL_IDS[index] || step.state !== CAUSAL_STATES[index]) {
      throw new KarmaMirrorError(`Lantern causal step order changed at ${index}`);
    }
    CAUSAL_STEP_FIELDS.forEach((field) =>
      assertText(step[field], `Lantern causal step ${index} ${field}`));
  });

  const policyTraceTokens = Object.keys(lexicon.policy_trace_glossary);
  if (!sameSet(policyTraceTokens, expectedPolicyTraceTokens())) {
    throw new KarmaMirrorError("Lantern policy trace glossary changed");
  }
  for (const [token, explanation] of Object.entries(lexicon.policy_trace_glossary)) {
    assertText(token, "Lantern policy trace token");
    assertText(explanation, `Lantern policy trace explanation ${token}`);
  }
  if (!sameSet(Object.keys(lexicon.uncertainty_glossary), UNCERTAINTY_TOKENS)) {
    throw new KarmaMirrorError("Lantern uncertainty glossary changed");
  }
  for (const [token, explanation] of Object.entries(lexicon.uncertainty_glossary)) {
    assertText(token, "Lantern uncertainty token");
    assertText(explanation, `Lantern uncertainty explanation ${token}`);
  }

  assertTextList(lexicon.explicit_unknowns, 4, "Lantern explicit unknowns");
  const behaviorIds = KARMA_BEHAVIORS.map(({ id }) => id);
  if (!sameSet(Object.keys(lexicon.behaviors), behaviorIds)) {
    throw new KarmaMirrorError("Lantern behavior vocabulary changed");
  }
  const learningTargets = new Set();
  for (const behaviorId of behaviorIds) {
    const behavior = lexicon.behaviors[behaviorId];
    assertExactFields(behavior, BEHAVIOR_FIELDS, `Lantern behavior ${behaviorId}`);
    BEHAVIOR_FIELDS.forEach((field) =>
      assertText(behavior[field], `Lantern behavior ${behaviorId} ${field}`));
    learningTargets.add(behavior.learning_target);
  }
  if (learningTargets.size !== behaviorIds.length) {
    throw new KarmaMirrorError("Lantern learning targets must be unique");
  }

  if (!arraysEqual(Object.keys(lexicon.stages), KARMA_STAGES)) {
    throw new KarmaMirrorError("Lantern stage vocabulary changed");
  }
  const optionIds = new Set();
  for (const stageName of KARMA_STAGES) {
    const stage = lexicon.stages[stageName];
    assertExactFields(stage, STAGE_FIELDS, `Lantern stage ${stageName}`);
    if (!(stage.review_role in lexicon.review_roles) ||
      !(stage.review_priority in lexicon.review_priorities)) {
      throw new KarmaMirrorError(`Lantern stage ${stageName} references an unknown role or priority`);
    }
    assertText(stage.explanation, `Lantern stage ${stageName} explanation`);
    if (!Array.isArray(stage.response_options) || stage.response_options.length !== 3) {
      throw new KarmaMirrorError(`Lantern stage ${stageName} must contain three options`);
    }
    for (const option of stage.response_options) {
      assertExactFields(option, OPTION_FIELDS, `Lantern stage ${stageName} option`);
      ["id", "label", "reason"].forEach((field) =>
        assertText(option[field], `Lantern stage ${stageName} option ${field}`));
      if (option.reversible !== true) {
        throw new KarmaMirrorError("every Lantern option must remain reversible");
      }
      optionIds.add(option.id);
    }
  }
  if (optionIds.size !== KARMA_STAGES.length * 3) {
    throw new KarmaMirrorError("Lantern option ids must be unique");
  }

  assertTextList(
    lexicon.human_escalation_prompts,
    3,
    "Lantern human escalation prompts",
  );
  assertTextList(lexicon.closure_requirements, 4, "Lantern closure requirements");
  assertText(lexicon.provenance, "Lantern provenance");
  if (!arraysEqual(lexicon.non_claims, LANTERN_NON_CLAIMS)) {
    throw new KarmaMirrorError("Lantern non-claims changed");
  }
  assertExactFields(
    lexicon.boundaries,
    [...LANTERN_TRUE_BOUNDARIES, ...LANTERN_FALSE_BOUNDARIES],
    "Lantern boundaries",
  );
  if (LANTERN_TRUE_BOUNDARIES.some((field) => lexicon.boundaries[field] !== true)) {
    throw new KarmaMirrorError("a required Lantern care boundary became false");
  }
  if (LANTERN_FALSE_BOUNDARIES.some((field) => lexicon.boundaries[field] !== false)) {
    throw new KarmaMirrorError("a prohibited Lantern effect became enabled");
  }
  requireReviewedDigest(
    lexicon,
    EXPECTED_LANTERN_CANONICAL_SHA256,
    "Lantern lexicon",
  );
  return lexicon;
}

deepFreeze(REVIEWED_HATSU);
validateReviewedHatsu();
requireReviewedDigest(
  CLOUDBELL_LEXICON,
  EXPECTED_CLOUDBELL_CANONICAL_SHA256,
  "Cloudbell lexicon",
);
validateLanternLexicon(lanternLexicon);
export const LANTERN_LEXICON = deepFreeze(lanternLexicon);
export const LANTERN_REVIEWED_DIGESTS = Object.freeze({
  hatsu: canonicalSemanticSha256(REVIEWED_HATSU),
  cloudbell: canonicalSemanticSha256(CLOUDBELL_LEXICON),
  lantern: canonicalSemanticSha256(LANTERN_LEXICON),
});

function epistemicKey(event) {
  if (event.evidence_complete !== true) return "declared-incomplete";
  if (event.declared_purpose === "ambiguous") return "declared-ambiguous";
  return "declared-complete";
}

function reviewedSources(input, suppliedReceipt, suppliedCard) {
  const event = normalizeKarmaEvent(input);
  const actualReceipt = createKarmaReceipt(event);
  if (suppliedReceipt !== undefined &&
    canonicalKarmaJson(suppliedReceipt) !== canonicalKarmaJson(actualReceipt)) {
    throw new KarmaMirrorError("supplied KARMA receipt does not match the normalized event");
  }
  const receipt = suppliedReceipt ?? actualReceipt;
  const actualCard = createCloudbellCard(event, receipt);
  if (suppliedCard !== undefined) {
    validateCloudbellCard(suppliedCard);
    if (canonicalKarmaJson(suppliedCard) !== canonicalKarmaJson(actualCard)) {
      throw new KarmaMirrorError("supplied Cloudbell card does not match the event and receipt");
    }
  }
  return { event, receipt, card: suppliedCard ?? actualCard };
}

function cloneEvent(event) {
  return {
    schema: event.schema,
    behavior: event.behavior,
    repetition: event.repetition,
    boundary_crossings: event.boundary_crossings,
    requested_effect: event.requested_effect,
    declared_purpose: event.declared_purpose,
    scope_attested: event.scope_attested,
    evidence_complete: event.evidence_complete,
  };
}

function composeLanternBrief(event, receipt, card, lexicon) {
  const epistemic = lexicon.epistemic_states[epistemicKey(event)];
  const behavior = lexicon.behaviors[event.behavior];
  const stage = lexicon.stages[receipt.stage];
  const role = lexicon.review_roles[stage.review_role];
  const priority = lexicon.review_priorities[stage.review_priority];
  const truthReceipt = {
    schema: LANTERN_TRUTH_SCHEMA,
    epistemic_id: epistemic.id,
    epistemic_title: epistemic.title,
    epistemic_explanation: epistemic.explanation,
    normalized_signals: {
      behavior: event.behavior,
      repetition: event.repetition,
      boundary_crossings: event.boundary_crossings,
      requested_effect: event.requested_effect,
    },
    declarations: {
      declared_purpose: event.declared_purpose,
      scope_attested: event.scope_attested,
      evidence_complete: event.evidence_complete,
    },
    policy_trace: receipt.evidence.map((token) => ({
      token,
      explanation: lexicon.policy_trace_glossary[token],
    })),
    policy_inferences: [
      {
        kind: "karma-stage",
        id: card.stage_id,
        explanation: stage.explanation,
      },
      {
        kind: "cloudbell-signature",
        id: card.signature_id,
        explanation: card.mechanism,
      },
    ],
    uncertainties: receipt.uncertainties.map((token) => ({
      token,
      explanation: lexicon.uncertainty_glossary[token],
    })),
    explicit_unknowns: [...lexicon.explicit_unknowns],
    provenance: lexicon.provenance,
  };
  const actionCard = {
    schema: LANTERN_ACTION_SCHEMA,
    suggested_review_role_id: role.id,
    suggested_review_role_title: role.title,
    review_priority_id: priority.id,
    review_priority_title: priority.title,
    review_priority_explanation: priority.explanation,
    policy_stage: receipt.stage,
    advisory_route: receipt.route,
    advisory_capability_percent: receipt.real_capability_percent,
    display_friction_units: receipt.friction_units,
    advisory_recovery_steps: receipt.ttl_steps,
    policy_values_advisory_only: true,
    options: stage.response_options.map((option) => ({
      id: option.id,
      label: option.label,
      reason: option.reason,
      reversible: option.reversible,
    })),
    human_escalation_prompts: [...lexicon.human_escalation_prompts],
    recovery: receipt.recovery,
    reversible_only: true,
    human_decision_required: true,
    options_proposed_only: true,
    action_executed: false,
    authority_granted: false,
  };
  const learningSeed = {
    schema: LANTERN_LEARNING_SCHEMA,
    lesson_class_id: `karma.lesson.${event.behavior}.${receipt.stage}.v1`,
    replay_event: cloneEvent(event),
    regression_targets: [
      behavior.learning_target,
      "stage-recovery-remains-exact",
      "zero-effect-boundaries-remain-false",
    ],
    architecture_questions: [
      behavior.architecture_question,
      "Which earlier boundary could make this lesson cheaper to discover and safer to recover from?",
    ],
    closure_requirements: [...lexicon.closure_requirements],
    closure_status: "open",
    future_use: "candidate-design-input",
    automatic_test_creation: false,
    automatic_policy_mutation: false,
    persistent_storage: false,
  };
  return {
    schema: LANTERN_BRIEF_SCHEMA,
    ability_id: lexicon.ability.id,
    ability_name: lexicon.ability.name,
    source_event_schema: KARMA_EVENT_SCHEMA,
    source_receipt_schema: KARMA_RECEIPT_SCHEMA,
    source_cloudbell_schema: CLOUDBELL_CARD_SCHEMA,
    source_behavior: event.behavior,
    source_signature_id: card.signature_id,
    source_stage: receipt.stage,
    headline: behavior.headline,
    mechanism: card.mechanism,
    truth_receipt: truthReceipt,
    action_card: actionCard,
    learning_seed: learningSeed,
    causal_rail: lexicon.causal_steps.map((step) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      state: step.state,
    })),
    virtues: [...receipt.virtues],
    recovery: receipt.recovery,
    ...Object.fromEntries(
      LANTERN_TRUE_BOUNDARIES.map((field) => [field, lexicon.boundaries[field]]),
    ),
    ...Object.fromEntries(
      LANTERN_FALSE_BOUNDARIES.map((field) => [field, lexicon.boundaries[field]]),
    ),
    non_claims: [...lexicon.non_claims],
  };
}

export function validateKarmaLanternBrief(brief, lexicon = LANTERN_LEXICON) {
  validateLanternLexicon(lexicon);
  assertExactFields(brief, LANTERN_BRIEF_FIELDS, "Lantern brief");
  if (brief.schema !== LANTERN_BRIEF_SCHEMA) {
    throw new KarmaMirrorError("unexpected Lantern brief schema");
  }
  const { truth_receipt: truth, action_card: action, learning_seed: learning } = brief;
  assertExactFields(truth, TRUTH_FIELDS, "Lantern Truth Receipt");
  assertExactFields(action, ACTION_FIELDS, "Lantern Action Card");
  assertExactFields(learning, LEARNING_FIELDS, "Lantern Learning Seed");
  if (truth.schema !== LANTERN_TRUTH_SCHEMA || action.schema !== LANTERN_ACTION_SCHEMA) {
    throw new KarmaMirrorError("unexpected Lantern truth or action schema");
  }
  if (learning.schema !== LANTERN_LEARNING_SCHEMA) {
    throw new KarmaMirrorError("unexpected Lantern learning schema");
  }
  assertExactFields(truth.normalized_signals, SIGNAL_FIELDS, "Lantern normalized signals");
  assertExactFields(truth.declarations, DECLARATION_FIELDS, "Lantern declarations");
  assertObjectList(truth.policy_trace, 2, 7, GLOSS_FIELDS, "Lantern policy trace");
  assertObjectList(truth.uncertainties, 0, 4, GLOSS_FIELDS, "Lantern uncertainties");
  assertObjectList(
    truth.policy_inferences,
    2,
    2,
    INFERENCE_FIELDS,
    "Lantern policy inferences",
  );
  assertObjectList(action.options, 3, 3, OPTION_FIELDS, "Lantern action options");
  assertObjectList(brief.causal_rail, 6, 6, CAUSAL_STEP_FIELDS, "Lantern causal rail");
  const { event, receipt, card } = reviewedSources(learning.replay_event);
  const expected = composeLanternBrief(event, receipt, card, lexicon);
  if (canonicalKarmaJson(brief) !== canonicalKarmaJson(expected)) {
    throw new KarmaMirrorError("Lantern brief differs from its normalized replay");
  }
  return brief;
}

export function createKarmaLanternBrief(input, suppliedReceipt, suppliedCard) {
  const { event, receipt, card } = reviewedSources(
    input,
    suppliedReceipt,
    suppliedCard,
  );
  const brief = composeLanternBrief(event, receipt, card, LANTERN_LEXICON);
  validateKarmaLanternBrief(brief);
  return deepFreeze(brief);
}
