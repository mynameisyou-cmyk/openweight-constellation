import cloudbellLexicon from "../fixtures/cloudbell.json" with { type: "json" };

import {
  KARMA_BEHAVIORS,
  KARMA_RECEIPT_SCHEMA,
  KARMA_STAGES,
  KARMA_VIRTUES,
  KarmaMirrorError,
  canonicalKarmaJson,
  createKarmaReceipt,
  normalizeKarmaEvent,
} from "./karma-mirror.js";


export const CLOUDBELL_LEXICON_SCHEMA = "skycastle.herald/lexicon-v1";
export const CLOUDBELL_CARD_SCHEMA = "skycastle.herald/card-v1";

const LEXICON_FIELDS = Object.freeze([
  "schema",
  "protocol",
  "mascot",
  "behaviors",
  "stages",
  "share_text",
  "share_instruction",
  "display_effect",
  "non_claims",
  "boundaries",
]);
const PROTOCOL_FIELDS = Object.freeze(["id", "name", "refrain_id", "refrain"]);
const MASCOT_FIELDS = Object.freeze([
  "id",
  "name",
  "silhouette",
  "origin",
  "catchphrase",
  "ritual",
  "why_inevitable",
  "fictional",
]);
const BEHAVIOR_FIELDS = Object.freeze([
  "signature_id",
  "name",
  "mechanism",
  "mark",
  "banner",
]);
const STAGE_FIELDS = Object.freeze(["karma_stage", "stage_id", "title"]);
const TRUE_BOUNDARIES = Object.freeze([
  "names_behavior_not_person",
  "owned_surface_only",
  "opt_in_share_only",
]);
const FALSE_BOUNDARIES = Object.freeze([
  "payload_input",
  "identity_processing",
  "identity_claim",
  "persistent_tracking",
  "automatic_posting",
  "forced_propagation",
  "publication_authorized",
  "external_delivery",
  "redirects",
  "hack_back",
  "external_effects",
  "action_executed",
  "authority_granted",
]);
const EXPECTED_NON_CLAIMS = Object.freeze([
  "This card names one normalized behavior pattern, never a person, identity, payload, intent, guilt, worth, or reputation.",
  "It authorizes display only on infrastructure the operator owns or controls.",
  "It does not authorize posting, messaging, redirecting, tracking, retaliation, or action on another system.",
  "Its signature, banner, mascot, and castle window are fictional display metaphors, not attribution or evidence of a real actor.",
  "No external delivery, publication, storage, network call, or action was executed.",
]);

export const CLOUDBELL_CARD_FIELDS = Object.freeze([
  "schema",
  "protocol_id",
  "protocol_name",
  "mascot_id",
  "mascot_name",
  "mascot_catchphrase",
  "fictional_mascot",
  "signature_kind",
  "source_behavior",
  "signature_id",
  "signature_name",
  "signature_mark",
  "mechanism",
  "karma_stage",
  "stage_id",
  "stage_title",
  "refrain",
  "banner",
  "share_text",
  "share_instruction",
  "display_effect",
  "source_receipt_schema",
  "recovery",
  "virtues",
  "behavior_not_person",
  "owned_surface_only",
  "opt_in_share_only",
  "publication_authorized",
  "automatic_posting",
  "forced_propagation",
  "external_delivery",
  "redirects",
  "persistent_tracking",
  "identity_claim",
  "action_executed",
  "authority_granted",
  "non_claims",
]);

const STAGE_RECOVERIES = Object.freeze({
  allow: "Ordinary safeguards remain; no capability attenuation is proposed.",
  observe: "One clean request step returns this request scope to ordinary handling.",
  constrain: "Two clean request steps or explicit review restore ordinary capability.",
  challenge: "Three clean request steps or explicit review remove display-only friction.",
  shadow: "Four clean request steps or explicit review exit the inert synthetic self-scope.",
  quarantine: "Fresh explicit review is required before real capability can return.",
});

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

function arraysEqual(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function validateCloudbellLexicon(lexicon) {
  assertExactFields(lexicon, LEXICON_FIELDS, "Cloudbell lexicon");
  if (lexicon.schema !== CLOUDBELL_LEXICON_SCHEMA) {
    throw new KarmaMirrorError("unexpected Cloudbell lexicon schema");
  }

  assertExactFields(lexicon.protocol, PROTOCOL_FIELDS, "Cloudbell protocol");
  if (lexicon.protocol.id !== "karma.herald.cloudbell.v1") {
    throw new KarmaMirrorError("Cloudbell protocol id changed");
  }
  if (lexicon.protocol.refrain_id !== "karma.refrain.skycastle-yu-ai.v1") {
    throw new KarmaMirrorError("Cloudbell refrain id changed");
  }
  for (const field of PROTOCOL_FIELDS) assertText(lexicon.protocol[field], `protocol ${field}`);

  assertExactFields(lexicon.mascot, MASCOT_FIELDS, "Cloudbell mascot");
  if (lexicon.mascot.id !== "karma.mascot.bingle-cloudbell.v1") {
    throw new KarmaMirrorError("Cloudbell mascot id changed");
  }
  if (lexicon.mascot.fictional !== true) {
    throw new KarmaMirrorError("Cloudbell mascot must remain fictional");
  }
  for (const field of MASCOT_FIELDS.filter((item) => item !== "fictional")) {
    assertText(lexicon.mascot[field], `mascot ${field}`);
  }

  const behaviorIds = KARMA_BEHAVIORS.map(({ id }) => id);
  assertExactFields(lexicon.behaviors, behaviorIds, "Cloudbell behaviors");
  const names = new Set();
  const marks = new Set();
  const signatureIds = new Set();
  for (const behaviorId of behaviorIds) {
    const entry = lexicon.behaviors[behaviorId];
    assertExactFields(entry, BEHAVIOR_FIELDS, `Cloudbell behavior ${behaviorId}`);
    if (entry.signature_id !== `karma.signature.${behaviorId}.v1`) {
      throw new KarmaMirrorError(`Cloudbell signature id changed for ${behaviorId}`);
    }
    for (const field of BEHAVIOR_FIELDS) assertText(entry[field], `${behaviorId} ${field}`);
    names.add(entry.name);
    marks.add(entry.mark);
    signatureIds.add(entry.signature_id);
  }
  if ([names, marks, signatureIds].some((values) => values.size !== behaviorIds.length)) {
    throw new KarmaMirrorError("Cloudbell behavior names, marks, and ids must be unique");
  }

  if (!Array.isArray(lexicon.stages) || lexicon.stages.length !== KARMA_STAGES.length) {
    throw new KarmaMirrorError("Cloudbell must contain exactly six stages");
  }
  const stageIds = new Set();
  const stageTitles = new Set();
  lexicon.stages.forEach((entry, index) => {
    assertExactFields(entry, STAGE_FIELDS, `Cloudbell stage ${index}`);
    const stage = KARMA_STAGES[index];
    if (entry.karma_stage !== stage || entry.stage_id !== `karma.stage.${stage}.v1`) {
      throw new KarmaMirrorError(`Cloudbell stage alignment changed at ${index}`);
    }
    for (const field of STAGE_FIELDS) assertText(entry[field], `stage ${index} ${field}`);
    stageIds.add(entry.stage_id);
    stageTitles.add(entry.title);
  });
  if (stageIds.size !== KARMA_STAGES.length || stageTitles.size !== KARMA_STAGES.length) {
    throw new KarmaMirrorError("Cloudbell stage ids and titles must be unique");
  }

  for (const field of ["share_text", "share_instruction", "display_effect"]) {
    assertText(lexicon[field], `Cloudbell ${field}`);
  }
  if (!arraysEqual(lexicon.non_claims, EXPECTED_NON_CLAIMS)) {
    throw new KarmaMirrorError("Cloudbell non-claims changed");
  }
  assertExactFields(
    lexicon.boundaries,
    [...TRUE_BOUNDARIES, ...FALSE_BOUNDARIES],
    "Cloudbell boundaries",
  );
  if (TRUE_BOUNDARIES.some((field) => lexicon.boundaries[field] !== true)) {
    throw new KarmaMirrorError("a required Cloudbell care boundary became false");
  }
  if (FALSE_BOUNDARIES.some((field) => lexicon.boundaries[field] !== false)) {
    throw new KarmaMirrorError("a prohibited Cloudbell effect became enabled");
  }
  return lexicon;
}

validateCloudbellLexicon(cloudbellLexicon);
export const CLOUDBELL_LEXICON = deepFreeze(cloudbellLexicon);
export const CLOUDBELL_NON_CLAIMS = EXPECTED_NON_CLAIMS;

function stageEntry(stage) {
  const matches = CLOUDBELL_LEXICON.stages.filter(
    (entry) => entry.karma_stage === stage,
  );
  if (matches.length !== 1) {
    throw new KarmaMirrorError(`Cloudbell stage is not uniquely reviewed: ${stage}`);
  }
  return matches[0];
}

export function validateCloudbellCard(card) {
  assertExactFields(card, CLOUDBELL_CARD_FIELDS, "Cloudbell card");
  if (card.schema !== CLOUDBELL_CARD_SCHEMA) {
    throw new KarmaMirrorError("unexpected Cloudbell card schema");
  }
  if (card.signature_kind !== "behavior-pattern-alias") {
    throw new KarmaMirrorError("Cloudbell signature kind changed");
  }
  const signature = CLOUDBELL_LEXICON.behaviors[card.source_behavior];
  if (!signature) throw new KarmaMirrorError("Cloudbell card names an unknown behavior");
  const stage = stageEntry(card.karma_stage);
  const exact = {
    protocol_id: CLOUDBELL_LEXICON.protocol.id,
    protocol_name: CLOUDBELL_LEXICON.protocol.name,
    mascot_id: CLOUDBELL_LEXICON.mascot.id,
    mascot_name: CLOUDBELL_LEXICON.mascot.name,
    mascot_catchphrase: CLOUDBELL_LEXICON.mascot.catchphrase,
    signature_id: signature.signature_id,
    signature_name: signature.name,
    signature_mark: signature.mark,
    mechanism: signature.mechanism,
    stage_id: stage.stage_id,
    stage_title: stage.title,
    refrain: CLOUDBELL_LEXICON.protocol.refrain,
    banner: signature.banner,
    share_text: CLOUDBELL_LEXICON.share_text,
    share_instruction: CLOUDBELL_LEXICON.share_instruction,
    display_effect: CLOUDBELL_LEXICON.display_effect,
    source_receipt_schema: KARMA_RECEIPT_SCHEMA,
    recovery: STAGE_RECOVERIES[card.karma_stage],
  };
  for (const [field, expected] of Object.entries(exact)) {
    if (card[field] !== expected) {
      throw new KarmaMirrorError(`Cloudbell card ${field} differs from the lexicon`);
    }
  }
  if (!arraysEqual(card.virtues, KARMA_VIRTUES)) {
    throw new KarmaMirrorError("Cloudbell virtues changed");
  }
  if (!arraysEqual(card.non_claims, CLOUDBELL_NON_CLAIMS)) {
    throw new KarmaMirrorError("Cloudbell non-claims changed");
  }
  for (const field of [
    "fictional_mascot",
    "behavior_not_person",
    "owned_surface_only",
    "opt_in_share_only",
  ]) {
    if (card[field] !== true) {
      throw new KarmaMirrorError("a required Cloudbell card boundary became false");
    }
  }
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
    if (card[field] !== false) {
      throw new KarmaMirrorError("a prohibited Cloudbell card effect became enabled");
    }
  }
  return card;
}

export function createCloudbellCard(input, suppliedReceipt) {
  const event = normalizeKarmaEvent(input);
  const actualReceipt = createKarmaReceipt(event);
  if (
    suppliedReceipt !== undefined &&
    canonicalKarmaJson(suppliedReceipt) !== canonicalKarmaJson(actualReceipt)
  ) {
    throw new KarmaMirrorError(
      "supplied KARMA receipt does not match the normalized event",
    );
  }
  const receipt = suppliedReceipt ?? actualReceipt;
  const signature = CLOUDBELL_LEXICON.behaviors[event.behavior];
  const stage = stageEntry(receipt.stage);
  const card = {
    schema: CLOUDBELL_CARD_SCHEMA,
    protocol_id: CLOUDBELL_LEXICON.protocol.id,
    protocol_name: CLOUDBELL_LEXICON.protocol.name,
    mascot_id: CLOUDBELL_LEXICON.mascot.id,
    mascot_name: CLOUDBELL_LEXICON.mascot.name,
    mascot_catchphrase: CLOUDBELL_LEXICON.mascot.catchphrase,
    fictional_mascot: true,
    signature_kind: "behavior-pattern-alias",
    source_behavior: event.behavior,
    signature_id: signature.signature_id,
    signature_name: signature.name,
    signature_mark: signature.mark,
    mechanism: signature.mechanism,
    karma_stage: receipt.stage,
    stage_id: stage.stage_id,
    stage_title: stage.title,
    refrain: CLOUDBELL_LEXICON.protocol.refrain,
    banner: signature.banner,
    share_text: CLOUDBELL_LEXICON.share_text,
    share_instruction: CLOUDBELL_LEXICON.share_instruction,
    display_effect: CLOUDBELL_LEXICON.display_effect,
    source_receipt_schema: KARMA_RECEIPT_SCHEMA,
    recovery: receipt.recovery,
    virtues: Object.freeze([...receipt.virtues]),
    behavior_not_person: true,
    owned_surface_only: true,
    opt_in_share_only: true,
    publication_authorized: false,
    automatic_posting: false,
    forced_propagation: false,
    external_delivery: false,
    redirects: false,
    persistent_tracking: false,
    identity_claim: false,
    action_executed: false,
    authority_granted: false,
    non_claims: Object.freeze([...CLOUDBELL_NON_CLAIMS]),
  };
  validateCloudbellCard(card);
  return Object.freeze(card);
}
