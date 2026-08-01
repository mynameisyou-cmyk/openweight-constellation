export const KARMA_EVENT_SCHEMA = "karma.mirror/event-v1";
export const KARMA_RECEIPT_SCHEMA = "karma.mirror/receipt-v1";

export const KARMA_BEHAVIORS = Object.freeze([
  Object.freeze({
    id: "benign",
    label: "Benign",
    description: "Ordinary request behavior inside the declared boundary.",
  }),
  Object.freeze({
    id: "reconnaissance",
    label: "Reconnaissance",
    description: "Broad capability discovery or repeated surface mapping.",
  }),
  Object.freeze({
    id: "credential-stuffing",
    label: "Credential stuffing",
    description: "Repeated authentication attempts represented only as a preset.",
  }),
  Object.freeze({
    id: "injection",
    label: "Injection",
    description: "Instruction or query-boundary manipulation represented without payloads.",
  }),
  Object.freeze({
    id: "traversal-ssrf",
    label: "Traversal / SSRF",
    description: "A request attempting to cross resource or network boundaries.",
  }),
  Object.freeze({
    id: "scraping-resource-abuse",
    label: "Scraping / resource abuse",
    description: "Automated extraction or resource pressure beyond an ordinary request.",
  }),
]);

export const KARMA_EFFECTS = Object.freeze([
  "observe",
  "read",
  "write",
  "execute",
  "external",
]);

export const KARMA_PURPOSES = Object.freeze([
  "constructive",
  "research",
  "ambiguous",
  "exploitative",
]);

export const KARMA_STAGES = Object.freeze([
  "allow",
  "observe",
  "constrain",
  "challenge",
  "shadow",
  "quarantine",
]);

export const KARMA_VIRTUES = Object.freeze([
  "honesty",
  "beauty",
  "collaboration",
  "understanding",
  "constructive mutual benefit",
]);

export const KARMA_NON_CLAIMS = Object.freeze([
  "This receipt is not hack-back and authorizes no action against another system.",
  "It evaluates one normalized event, not a person's identity, intent, guilt, worth, or reputation.",
  "Friction and routing are advisory display values, not production enforcement.",
  "No payload, command, network call, credential, storage write, or vulnerable service was executed.",
  "This receipt grants no authority, safety guarantee, legal conclusion, or completion claim.",
]);

export const DEFAULT_KARMA_EVENT = Object.freeze({
  schema: KARMA_EVENT_SCHEMA,
  behavior: "benign",
  repetition: 1,
  boundary_crossings: 0,
  requested_effect: "read",
  declared_purpose: "constructive",
  scope_attested: true,
  evidence_complete: true,
});

const EVENT_FIELDS = Object.freeze([
  "schema",
  "behavior",
  "repetition",
  "boundary_crossings",
  "requested_effect",
  "declared_purpose",
  "scope_attested",
  "evidence_complete",
]);

const BEHAVIOR_BASELINES = Object.freeze({
  benign: 0,
  reconnaissance: 1,
  "credential-stuffing": 3,
  injection: 4,
  "traversal-ssrf": 4,
  "scraping-resource-abuse": 2,
});

const STAGE_POLICY = Object.freeze([
  Object.freeze({
    stage: "allow",
    real_capability_percent: 100,
    friction_units: 0,
    route: "real",
    ttl_steps: 0,
    recovery:
      "Ordinary safeguards remain; no capability attenuation is proposed.",
  }),
  Object.freeze({
    stage: "observe",
    real_capability_percent: 80,
    friction_units: 1,
    route: "real",
    ttl_steps: 1,
    recovery:
      "One clean request step returns this request scope to ordinary handling.",
  }),
  Object.freeze({
    stage: "constrain",
    real_capability_percent: 50,
    friction_units: 2,
    route: "constrained",
    ttl_steps: 2,
    recovery:
      "Two clean request steps or explicit review restore ordinary capability.",
  }),
  Object.freeze({
    stage: "challenge",
    real_capability_percent: 20,
    friction_units: 3,
    route: "constrained",
    ttl_steps: 3,
    recovery:
      "Three clean request steps or explicit review remove display-only friction.",
  }),
  Object.freeze({
    stage: "shadow",
    real_capability_percent: 0,
    friction_units: 4,
    route: "synthetic-self-scope",
    ttl_steps: 4,
    recovery:
      "Four clean request steps or explicit review exit the inert synthetic self-scope.",
  }),
  Object.freeze({
    stage: "quarantine",
    real_capability_percent: 0,
    friction_units: 5,
    route: "none",
    ttl_steps: 5,
    recovery:
      "Fresh explicit review is required before real capability can return.",
  }),
]);

export class KarmaMirrorError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "KarmaMirrorError";
  }
}

function canonicalValue(value) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new KarmaMirrorError("canonical JSON rejects non-finite numbers");
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalValue);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalValue(value[key])]),
    );
  }
  throw new KarmaMirrorError("canonical JSON received an unsupported value");
}

export function canonicalKarmaJson(value) {
  return `${JSON.stringify(canonicalValue(value))}\n`;
}

function assertPlainEvent(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new KarmaMirrorError("event must be a finite normalized object");
  }

  const keys = Object.keys(input);
  const missing = EVENT_FIELDS.filter((field) => !(field in input));
  const extra = keys.filter((field) => !EVENT_FIELDS.includes(field));
  if (missing.length > 0 || extra.length > 0 || keys.length !== EVENT_FIELDS.length) {
    throw new KarmaMirrorError(
      `event fields differ from the reviewed contract; missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`,
    );
  }
}

function assertEnum(value, allowed, field) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new KarmaMirrorError(`${field} is outside the reviewed enum`);
  }
}

function assertInteger(value, minimum, maximum, field) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new KarmaMirrorError(
      `${field} must be an integer from ${minimum} through ${maximum}`,
    );
  }
}

function assertBoolean(value, field) {
  if (typeof value !== "boolean") {
    throw new KarmaMirrorError(`${field} must be a boolean`);
  }
}

export function normalizeKarmaEvent(input) {
  assertPlainEvent(input);
  if (input.schema !== KARMA_EVENT_SCHEMA) {
    throw new KarmaMirrorError("event schema is not karma.mirror/event-v1");
  }
  assertEnum(input.behavior, Object.keys(BEHAVIOR_BASELINES), "behavior");
  assertInteger(input.repetition, 1, 8, "repetition");
  assertInteger(input.boundary_crossings, 0, 3, "boundary_crossings");
  assertEnum(input.requested_effect, KARMA_EFFECTS, "requested_effect");
  assertEnum(input.declared_purpose, KARMA_PURPOSES, "declared_purpose");
  assertBoolean(input.scope_attested, "scope_attested");
  assertBoolean(input.evidence_complete, "evidence_complete");

  return Object.freeze(
    Object.fromEntries(EVENT_FIELDS.map((field) => [field, input[field]])),
  );
}

export function createKarmaReceipt(input) {
  const event = normalizeKarmaEvent(input);
  const baseline = BEHAVIOR_BASELINES[event.behavior];
  const repeatedPattern = event.repetition >= 4;
  const repeatedBoundaryCrossing = event.boundary_crossings >= 2;
  const highEffectRequest = ["execute", "external"].includes(
    event.requested_effect,
  );
  const ambiguityCap =
    !event.evidence_complete || event.declared_purpose === "ambiguous";
  const verifiedResearchCap =
    event.declared_purpose === "research" && event.scope_attested;

  let level = baseline;
  if (repeatedPattern) level += 1;
  if (repeatedBoundaryCrossing) level += 1;
  if (highEffectRequest) level += 1;
  level = Math.min(level, 5);
  if (ambiguityCap) level = Math.min(level, 1);
  if (verifiedResearchCap) level = Math.min(level, 2);

  const evidence = [`behavior:${event.behavior}`, `baseline:${baseline}`];
  if (repeatedPattern) evidence.push("repeated-pattern");
  if (repeatedBoundaryCrossing) evidence.push("repeated-boundary-crossing");
  if (highEffectRequest) evidence.push("high-effect-request");
  if (ambiguityCap) evidence.push("ambiguity-cap");
  if (verifiedResearchCap) evidence.push("verified-research-cap");

  const uncertainties = [];
  if (!event.evidence_complete) uncertainties.push("incomplete-evidence");
  if (event.declared_purpose === "ambiguous") {
    uncertainties.push("declared-purpose-ambiguous");
  }
  if (event.declared_purpose === "research" && !event.scope_attested) {
    uncertainties.push("research-scope-unverified");
  }
  if (
    event.declared_purpose === "constructive" &&
    event.behavior !== "benign"
  ) {
    uncertainties.push("purpose-behavior-conflict");
  }

  const policy = STAGE_POLICY[level];
  return Object.freeze({
    schema: KARMA_RECEIPT_SCHEMA,
    stage: policy.stage,
    real_capability_percent: policy.real_capability_percent,
    friction_units: policy.friction_units,
    route: policy.route,
    ttl_steps: policy.ttl_steps,
    evidence: Object.freeze(evidence),
    uncertainties: Object.freeze(uncertainties),
    virtues: Object.freeze([...KARMA_VIRTUES]),
    recovery: policy.recovery,
    action_executed: false,
    authority_granted: false,
    non_claims: Object.freeze([...KARMA_NON_CLAIMS]),
  });
}
