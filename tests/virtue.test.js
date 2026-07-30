import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_VIRTUES,
  VIRTUES,
  composeVirtueReceipt,
  scoreVirtues,
} from "../lib/constellation.js";

test("virtue receipt is deterministic and carries no authority", () => {
  const first = composeVirtueReceipt(DEFAULT_VIRTUES);
  const second = composeVirtueReceipt(DEFAULT_VIRTUES);

  assert.deepEqual(first, second);
  assert.equal(first.schema, "openweight-constellation/virtue-receipt-v1");
  assert.equal(first.authority, "reflective-only");
  assert.equal(first.externalEffect, "none");
  assert.equal("timestamp" in first, false);
  assert.equal("id" in first, false);
});

test("zero vector is zero and equal vectors report shared edges", () => {
  const zero = scoreVirtues(
    Object.fromEntries(VIRTUES.map(({ id }) => [id, 0])),
  );
  const equal = scoreVirtues(
    Object.fromEntries(VIRTUES.map(({ id }) => [id, 60])),
  );

  assert.equal(zero.integrity, 0);
  assert.equal(zero.state, "REPAIR");
  assert.equal(zero.weakest, "Shared");
  assert.equal(zero.strongest, "Shared");
  assert.equal(equal.weakest, "Shared");
  assert.equal(equal.strongest, "Shared");
});

test("raising one virtue never lowers integrity", () => {
  const values = [0, 20, 40, 60, 80, 100];
  let comparisons = 0;

  for (const honesty of values) {
    for (const beauty of values) {
      for (const collaboration of values) {
        for (const understanding of values) {
          for (const mutuality of values) {
            const baseline = {
              honesty,
              beauty,
              collaboration,
              understanding,
              mutuality,
            };
            const initial = scoreVirtues(baseline).integrity;
            for (const virtue of VIRTUES) {
              const raised = {
                ...baseline,
                [virtue.id]: Math.min(100, baseline[virtue.id] + 1),
              };
              assert.ok(scoreVirtues(raised).integrity >= initial);
              comparisons += 1;
            }
          }
        }
      }
    }
  }

  assert.equal(comparisons, 38880);
});

test("inputs are clamped without retaining extra fields", () => {
  const result = scoreVirtues({
    honesty: -20,
    beauty: 240,
    collaboration: 61.7,
    understanding: Number.NaN,
    mutuality: 55,
    identity: "must not survive",
  });

  assert.deepEqual(result.values, {
    honesty: 0,
    beauty: 100,
    collaboration: 62,
    understanding: 0,
    mutuality: 55,
  });
  assert.equal("identity" in result.values, false);
});

