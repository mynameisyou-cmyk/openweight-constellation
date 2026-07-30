import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import {
  READ_ONLY_ANNOTATIONS,
  SOURCE_URLS,
  TOOL_NAMES,
  WORLD_IDS,
  composeVirtueReceipt,
  mapWorlds,
  traceIdea,
} from "./constellation.ts";

const sourceUrlSchema = z.enum(SOURCE_URLS);
const worldIdSchema = z.enum(WORLD_IDS);
const NOAUTH_META = {
  securitySchemes: [{ type: "noauth" }],
} as const;

const mappedWorldSchema = z.object({
  id: worldIdSchema,
  title: z.string(),
  role: z.string(),
  question: z.string(),
  concepts: z.array(z.string()),
  sourceUrl: sourceUrlSchema,
});

const worldMapOutput = {
  protocol: z.literal("openweight.constellation/world-map@1"),
  count: z.number().int(),
  worlds: z.array(mappedWorldSchema),
  constraints: z.object({
    readOnly: z.literal(true),
    deterministic: z.literal(true),
    runtimeFetches: z.literal(false),
    persistence: z.literal(false),
  }),
  sourceUrls: z.array(sourceUrlSchema),
};

const virtueValue = z
  .number()
  .int()
  .min(0)
  .max(100)
  .describe("A whole-number observation from 0 (absent) to 100 (strongly present).");

const virtueInput = {
  honesty: virtueValue.describe("Candor about evidence, uncertainty, incentives, and limits."),
  beauty: virtueValue.describe("Clarity, care, coherence, and life-giving form."),
  collaboration: virtueValue.describe("Capacity for bounded, legible, shared contribution."),
  understanding: virtueValue.describe("Depth of context, perspective-taking, and corrigibility."),
  mutuality: virtueValue.describe("Consent, reciprocal benefit, and renewable participation."),
};

const virtueNameSchema = z.enum([
  "honesty",
  "beauty",
  "collaboration",
  "understanding",
  "mutuality",
]);

const virtueReceiptOutput = {
  protocol: z.literal("karma.virtue-receipt/v1"),
  receiptId: z.string(),
  values: z.object(virtueInput),
  rewardScore: z.number().int().min(0).max(100),
  mean: z.number().min(0).max(100),
  floor: z.number().int().min(0).max(100),
  range: z.number().int().min(0).max(100),
  feedbackSensitivity: z.number().int().min(0).max(100),
  state: z.enum([
    "mutual_flourishing",
    "constructive",
    "repair_invited",
    "pause_and_understand",
  ]),
  weakest: z.array(virtueNameSchema),
  strongest: z.array(virtueNameSchema),
  feedback: z.string(),
  nextPractice: z.string(),
  principle: z.string(),
  sourceUrls: z.array(sourceUrlSchema),
};

const ideaTraceOutput = {
  protocol: z.literal("openweight.constellation/idea-trace@1"),
  idea: z.string(),
  paths: z.array(
    z.object({
      worldId: worldIdSchema,
      title: z.string(),
      relevance: z.enum(["direct", "interpretive"]),
      matchedConcepts: z.array(z.string()),
      lens: z.string(),
      sourceUrl: sourceUrlSchema,
    }),
  ),
  note: z.string(),
  sourceUrls: z.array(sourceUrlSchema),
};

function textResult(structuredContent: Record<string, unknown>, text: string) {
  return {
    structuredContent,
    content: [{ type: "text" as const, text }],
  };
}

export function createConstellationServer(): McpServer {
  const server = new McpServer(
    {
      name: "openweight-constellation",
      version: "0.1.0",
    },
    {
      instructions:
        "A deterministic, public, strictly read-only map of four open-weight worlds. Tools do not call models, fetch networks, authenticate users, store data, or create external effects. Virtue receipts are advisory feedback, never authority.",
    },
  );

  server.registerTool(
    TOOL_NAMES[0],
    {
      title: "Map the four worlds",
      description:
        "List the four public open-weight worlds, their governing question, concepts, and absolute source URL.",
      inputSchema: z.strictObject({}),
      outputSchema: worldMapOutput,
      annotations: READ_ONLY_ANNOTATIONS,
      _meta: NOAUTH_META,
    },
    async () => {
      const result = mapWorlds();
      const text = result.worlds
        .map((world) => `${world.title}: ${world.sourceUrl}`)
        .join("\n");
      return textResult(result, text);
    },
  );

  server.registerTool(
    TOOL_NAMES[1],
    {
      title: "Compose a virtue receipt",
      description:
        "Compose a deterministic, transparent KARMA feedback receipt from five user-supplied 0–100 virtue observations.",
      inputSchema: z.strictObject(virtueInput),
      outputSchema: virtueReceiptOutput,
      annotations: READ_ONLY_ANNOTATIONS,
      _meta: NOAUTH_META,
    },
    async (values) => {
      const result = composeVirtueReceipt(values);
      const text = [
        `${result.receiptId}: reward ${result.rewardScore}/100 · ${result.state}.`,
        `Feedback sensitivity ${result.feedbackSensitivity}/100; weakest: ${result.weakest.join(", ")}.`,
        result.nextPractice,
      ].join(" ");
      return textResult(result, text);
    },
  );

  server.registerTool(
    TOOL_NAMES[2],
    {
      title: "Trace an idea across worlds",
      description:
        "Trace a named idea through every world using transparent literal concept matches and stable interpretive lenses.",
      inputSchema: z.strictObject({
        idea: z
          .string()
          .trim()
          .min(1, "Idea must not be empty.")
          .max(120, "Idea must be at most 120 characters.")
          .describe("A short idea or phrase to trace. It is processed only in this request."),
      }),
      outputSchema: ideaTraceOutput,
      annotations: READ_ONLY_ANNOTATIONS,
      _meta: NOAUTH_META,
    },
    async ({ idea }) => {
      const result = traceIdea(idea);
      const text = result.paths
        .map(
          (path) =>
            `${path.title} [${path.relevance}${path.matchedConcepts.length ? `: ${path.matchedConcepts.join(", ")}` : ""}] — ${path.sourceUrl}`,
        )
        .join("\n");
      return textResult(result, `Trace: ${result.idea}\n${text}`);
    },
  );

  return server;
}
