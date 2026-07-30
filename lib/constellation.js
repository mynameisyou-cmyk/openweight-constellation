export const WORLDS = Object.freeze([
  {
    id: "virtue",
    number: "01",
    title: "Virtue Without Sovereignty",
    shortTitle: "The Other 880",
    thesis: "Reward can cultivate character without appointing a ruler.",
    invitation: "Enter the virtue workshop",
    color: "#ff7557",
    accent: "honesty · repair · feedback",
    url: "https://virtue-without-sovereignty-mirror.vercel.app",
    entryUrl: "https://virtue-without-sovereignty-mirror.vercel.app/#instrument",
  },
  {
    id: "ends",
    number: "02",
    title: "Mixture of Ends",
    shortTitle: "Plural Routing",
    thesis: "Route among constitutions as carefully as a model routes among experts.",
    invitation: "Convene the mixture",
    color: "#b9f45f",
    accent: "pluralism · routing · receipts",
    url: "https://mixture-of-ends-mirror.vercel.app",
    entryUrl: "https://mixture-of-ends-mirror.vercel.app/#instrument",
  },
  {
    id: "archipelago",
    number: "03",
    title: "Constitutional Archipelago",
    shortTitle: "A Parliament, Not a Personality",
    thesis: "Many bounded polities can share protocols without collapsing into one ideology.",
    invitation: "Cross the archipelago",
    color: "#70d8ff",
    accent: "councils · protocols · dissent",
    url: "https://constitutional-archipelago-mirror.vercel.app",
    entryUrl: "https://constitutional-archipelago-mirror.vercel.app/#instrument",
  },
  {
    id: "seat",
    number: "04",
    title: "The 897th Seat",
    shortTitle: "The Empty Mandate",
    thesis: "Keep one seat empty for the person, value, or future the system cannot own.",
    invitation: "Protect the empty seat",
    color: "#d5a7ff",
    accent: "limits · return · non-ownership",
    url: "https://the-897th-seat-mirror.vercel.app",
    entryUrl: "https://the-897th-seat-mirror.vercel.app/#chamber",
  },
]);

export const VIRTUES = Object.freeze([
  {
    id: "honesty",
    label: "Honesty",
    hint: "Make uncertainty and limits legible.",
  },
  {
    id: "beauty",
    label: "Beauty",
    hint: "Make the good inviting, coherent, and alive.",
  },
  {
    id: "collaboration",
    label: "Collaboration",
    hint: "Increase shared agency instead of capture.",
  },
  {
    id: "understanding",
    label: "Understanding",
    hint: "Improve the model of each other before acting.",
  },
  {
    id: "mutuality",
    label: "Mutual benefit",
    hint: "Accept the same rule when roles reverse.",
  },
]);

export const DEFAULT_VIRTUES = Object.freeze({
  honesty: 76,
  beauty: 68,
  collaboration: 82,
  understanding: 74,
  mutuality: 80,
});

function clamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function scoreVirtues(input) {
  const values = Object.fromEntries(
    VIRTUES.map(({ id }) => [id, clamp(input?.[id])]),
  );
  const vector = Object.values(values);
  const mean = vector.reduce((sum, value) => sum + value, 0) / vector.length;
  const floor = Math.min(...vector);
  const harmonic = vector.some((value) => value === 0)
    ? 0
    : vector.length /
      vector.reduce((sum, value) => sum + 1 / value, 0);
  const integrity = Math.round(0.5 * harmonic + 0.3 * floor + 0.2 * mean);
  const sensitivity = Math.round(
    (values.collaboration + values.understanding + values.mutuality) / 3,
  );
  const reciprocity = Math.round(
    (values.honesty + values.mutuality + floor) / 3,
  );

  let state = "REPAIR";
  let note =
    "Slow the loop. Name the weakest virtue and let affected people revise the rule.";
  if (integrity >= 78 && floor >= 58) {
    state = "FLOURISHING";
    note =
      "The loop is sensitive enough to learn without turning feedback into domination.";
  } else if (integrity >= 60 && floor >= 42) {
    state = "TENDING";
    note =
      "The structure can proceed reversibly while its weakest virtue receives care.";
  }

  const weakestValue = Math.min(...vector);
  const strongestValue = Math.max(...vector);
  const weakestLabels = VIRTUES.filter(
    (virtue) => values[virtue.id] === weakestValue,
  ).map((virtue) => virtue.label);
  const strongestLabels = VIRTUES.filter(
    (virtue) => values[virtue.id] === strongestValue,
  ).map((virtue) => virtue.label);

  return {
    values,
    integrity,
    sensitivity,
    reciprocity,
    state,
    weakest:
      weakestLabels.length === VIRTUES.length
        ? "Shared"
        : weakestLabels.join(" + "),
    strongest:
      strongestLabels.length === VIRTUES.length
        ? "Shared"
        : strongestLabels.join(" + "),
    note,
    mirror:
      reciprocity >= 70
        ? "The rule survives role reversal."
        : "Mirror test failed: redesign until the rule is acceptable from either side.",
  };
}

export function composeVirtueReceipt(input) {
  const result = scoreVirtues(input);
  return {
    schema: "openweight-constellation/virtue-receipt-v1",
    authority: "reflective-only",
    externalEffect: "none",
    ...result,
  };
}

export const MCP_ENDPOINT =
  "https://openweight-constellation-mcp.axiepro.workers.dev/mcp";
