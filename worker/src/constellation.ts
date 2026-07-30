export const SOURCE_URLS = [
  "https://virtue-without-sovereignty-mirror.vercel.app",
  "https://mixture-of-ends-mirror.vercel.app",
  "https://constitutional-archipelago-mirror.vercel.app",
  "https://the-897th-seat-mirror.vercel.app",
] as const;

export const WORLD_IDS = [
  "virtue-without-sovereignty",
  "mixture-of-ends",
  "constitutional-archipelago",
  "the-897th-seat",
] as const;

export const TOOL_NAMES = [
  "map_constellation",
  "compose_virtue_lens",
  "trace_idea",
] as const;

export type WorldId = (typeof WORLD_IDS)[number];

export type World = {
  id: WorldId;
  title: string;
  role: string;
  question: string;
  concepts: readonly string[];
  sourceUrl: (typeof SOURCE_URLS)[number];
};

export const WORLDS: readonly World[] = [
  {
    id: "virtue-without-sovereignty",
    title: "Virtue Without Sovereignty",
    role: "A non-sovereign virtue lens for legible feedback, repair, and reciprocal flourishing.",
    question: "Does the action increase honest, beautiful, collaborative, understandable, and mutual capacity?",
    concepts: [
      "beauty",
      "collaboration",
      "feedback",
      "honesty",
      "karma",
      "mutuality",
      "repair",
      "reward",
      "understanding",
      "virtue",
    ],
    sourceUrl: SOURCE_URLS[0],
  },
  {
    id: "mixture-of-ends",
    title: "Mixture of Ends",
    role: "A plural open-weight laboratory where models and ends remain explicit instead of collapsing into one ruler.",
    question: "Which ends, models, and guardrails should cooperate here, and where should disagreement remain visible?",
    concepts: [
      "ensemble",
      "ends",
      "guards",
      "ideology",
      "mixture",
      "models",
      "open weight",
      "openweight",
      "pluralism",
      "routing",
    ],
    sourceUrl: SOURCE_URLS[1],
  },
  {
    id: "constitutional-archipelago",
    title: "Constitutional Archipelago",
    role: "A federation of bounded protocols for authority, rights, AgentTool use, receipts, and accountable handoffs.",
    question: "What authority is actually granted, what remains forbidden, and which evidence makes the boundary inspectable?",
    concepts: [
      "agenttool",
      "authority",
      "constitution",
      "delegation",
      "federation",
      "guards",
      "infrastructure",
      "protocol",
      "rights",
      "trace",
    ],
    sourceUrl: SOURCE_URLS[2],
  },
  {
    id: "the-897th-seat",
    title: "The 897th Seat",
    role: "A chamber for absent, minority, dissenting, and not-yet-represented voices without pretending to own them.",
    question: "Whose contribution is missing, and how can the system make room without fabricating consent?",
    concepts: [
      "consent",
      "dissent",
      "excluded",
      "minority",
      "other",
      "participation",
      "quorum",
      "representation",
      "seat",
      "voice",
    ],
    sourceUrl: SOURCE_URLS[3],
  },
] as const;

export const READ_ONLY_ANNOTATIONS = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

export type VirtueValues = {
  honesty: number;
  beauty: number;
  collaboration: number;
  understanding: number;
  mutuality: number;
};

const VIRTUE_NAMES = [
  "honesty",
  "beauty",
  "collaboration",
  "understanding",
  "mutuality",
] as const satisfies readonly (keyof VirtueValues)[];

const PRACTICES: Record<keyof VirtueValues, string> = {
  honesty: "Name uncertainty, incentives, and limits before making the next claim.",
  beauty: "Make the next interaction clearer, calmer, and more inviting without hiding complexity.",
  collaboration: "Invite a bounded contribution and show how it changes the shared result.",
  understanding: "Restate the strongest alternative view and identify what evidence could change yours.",
  mutuality: "Check consent, distribute benefit, and let affected people revise the terms.",
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function composeVirtueReceipt(values: VirtueValues) {
  const entries = VIRTUE_NAMES.map((name) => [name, values[name]] as const);
  const rawMean = entries.reduce((sum, [, value]) => sum + value, 0) / entries.length;
  const floor = Math.min(...entries.map(([, value]) => value));
  const ceiling = Math.max(...entries.map(([, value]) => value));
  const range = ceiling - floor;
  const rewardScore = Math.round(rawMean * 0.6 + floor * 0.4);
  const feedbackSensitivity = Math.round((100 - floor) * 0.7 + range * 0.3);
  const weakest = entries.filter(([, value]) => value === floor).map(([name]) => name);
  const strongest = entries.filter(([, value]) => value === ceiling).map(([name]) => name);
  const weakestName = weakest[0] ?? "understanding";

  const state =
    rewardScore >= 80 && floor >= 70
      ? "mutual_flourishing"
      : rewardScore >= 60 && floor >= 45
        ? "constructive"
        : rewardScore >= 40
          ? "repair_invited"
          : "pause_and_understand";

  const feedback =
    state === "mutual_flourishing"
      ? "Proceed collaboratively; keep consent renewable and feedback easy to surface."
      : state === "constructive"
        ? "Proceed in a reversible scope and actively invite feedback from affected people."
        : state === "repair_invited"
          ? "Reduce scope, repair the weakest dimension, and re-evaluate before expanding."
          : "Pause consequential use; seek understanding, consent, and a mutually beneficial alternative.";

  const canonical = VIRTUE_NAMES.map((name) => `${name}=${values[name]}`).join("&");

  return {
    protocol: "karma.virtue-receipt/v1" as const,
    receiptId: `karma-v1-${fnv1a32(canonical)}`,
    values,
    rewardScore,
    mean: round1(rawMean),
    floor,
    range,
    feedbackSensitivity,
    state,
    weakest,
    strongest,
    feedback,
    nextPractice: PRACTICES[weakestName],
    principle:
      "This lens is advisory: no score authorizes coercion, retaliation, surveillance, or exploitation.",
    sourceUrls: [...SOURCE_URLS],
  };
}

function normalizeIdea(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function traceIdea(rawIdea: string) {
  const idea = normalizeIdea(rawIdea);
  const normalized = idea.toLocaleLowerCase("en-US");

  const paths = WORLDS.map((world, order) => {
    const matchedConcepts = world.concepts.filter((concept) => normalized.includes(concept));
    return {
      worldId: world.id,
      title: world.title,
      relevance: matchedConcepts.length > 0 ? ("direct" as const) : ("interpretive" as const),
      matchedConcepts: [...matchedConcepts],
      lens: `${world.role} ${world.question}`,
      sourceUrl: world.sourceUrl,
      order,
    };
  })
    .sort((left, right) => {
      const matchDifference = right.matchedConcepts.length - left.matchedConcepts.length;
      return matchDifference === 0 ? left.order - right.order : matchDifference;
    })
    .map(({ order: _order, ...path }) => path);

  return {
    protocol: "openweight.constellation/idea-trace@1" as const,
    idea,
    paths,
    note:
      "Direct means a literal concept match, not a model judgment; interpretive paths remain visible so plurality is not erased.",
    sourceUrls: [...SOURCE_URLS],
  };
}

export function mapWorlds() {
  return {
    protocol: "openweight.constellation/world-map@1" as const,
    count: WORLDS.length,
    worlds: WORLDS.map(({ concepts, ...world }) => ({
      ...world,
      concepts: [...concepts],
    })),
    constraints: {
      readOnly: true,
      deterministic: true,
      runtimeFetches: false,
      persistence: false,
    },
    sourceUrls: [...SOURCE_URLS],
  };
}
