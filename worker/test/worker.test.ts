import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_MCP_BODY_BYTES,
  handleRequest,
} from "../src/index.ts";

const MCP_URL = "https://constellation.test/mcp";
const PROTOCOL_VERSION = "2025-11-25";
const HUB_ORIGIN = "https://openweight-constellation.vercel.app";

type RpcResponse = {
  jsonrpc: "2.0";
  id?: number | string | null;
  result?: Record<string, any>;
  error?: { code: number; message: string };
};

async function rpc(
  method: string,
  params: Record<string, unknown> = {},
  id: number | string = 1,
): Promise<{ response: Response; body: RpcResponse }> {
  const response = await handleRequest(
    new Request(MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": PROTOCOL_VERSION,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    }),
  );
  return { response, body: (await response.json()) as RpcResponse };
}

async function callTool(name: string, args: Record<string, unknown>) {
  return rpc("tools/call", { name, arguments: args });
}

test("health and manifest disclose the read-only, no-persistence boundary", async () => {
  const health = await handleRequest(new Request("https://constellation.test/health"));
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.equal(health.headers.get("set-cookie"), null);
  assert.deepEqual(await health.json(), {
    status: "ok",
    service: "openweight-constellation",
    version: "0.1.0",
    readOnly: true,
    persistence: false,
  });

  const manifest = await handleRequest(new Request("https://constellation.test/manifest.json"));
  const body = (await manifest.json()) as any;
  assert.equal(body.constraints.readOnly, true);
  assert.equal(body.constraints.persistence, false);
  assert.equal(body.constraints.runtimeFetches, false);
  assert.equal(body.constraints.analytics, false);
  assert.equal(body.constraints.inputLogging, false);
  assert.equal(body.constraints.personalDataCollection, false);
  assert.equal(body.constraints.requestBodyLimitBytes, MAX_MCP_BODY_BYTES);
  assert.equal(body.constraints.batchRequests, false);
  assert.equal(body.constraints.platformRateLimitRequired, true);
  assert.deepEqual(body.tools, [
    "map_constellation",
    "compose_virtue_lens",
    "trace_idea",
  ]);
  assert.equal(body.sourceUrls.length, 4);
  assert.ok(body.sourceUrls.every((url: string) => url.startsWith("https://")));
});

test("CORS rejects an unapproved browser preflight", async () => {
  const response = await handleRequest(
    new Request(MCP_URL, {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.net",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,mcp-protocol-version",
      },
    }),
  );

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("CORS echoes an explicitly approved browser Origin without credentials", async () => {
  const response = await handleRequest(
    new Request(MCP_URL, {
      method: "OPTIONS",
      headers: {
        Origin: HUB_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,mcp-protocol-version",
      },
    }),
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), HUB_ORIGIN);
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
  assert.match(response.headers.get("access-control-allow-headers") ?? "", /MCP-Protocol-Version/i);
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("Origin validation rejects evil, opaque, and malformed origins", async () => {
  for (const origin of ["https://evil.example", "null", "not-an-origin"]) {
    const response = await handleRequest(
      new Request(MCP_URL, {
        method: "OPTIONS",
        headers: { Origin: origin },
      }),
    );
    assert.equal(response.status, 403, origin);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    const body = (await response.json()) as RpcResponse;
    assert.equal(body.error?.code, -32000);
  }
});

test("initialize negotiates Streamable HTTP without creating a session", async () => {
  const { response, body } = await rpc("initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "constellation-test", version: "1.0.0" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.equal(response.headers.get("mcp-session-id"), null);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(body.result?.protocolVersion, PROTOCOL_VERSION);
  assert.equal(body.result?.serverInfo.name, "openweight-constellation");
  assert.equal(body.result?.capabilities.tools !== undefined, true);
  assert.match(body.result?.instructions, /strictly read-only/i);
});

test("notifications/initialized is accepted with HTTP 202 and an empty body", async () => {
  const response = await handleRequest(
    new Request(MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": PROTOCOL_VERSION,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    }),
  );
  assert.equal(response.status, 202);
  assert.equal(await response.text(), "");
});

test("tools/list exposes exactly three accurately annotated tools", async () => {
  const { body } = await rpc("tools/list");
  assert.equal(body.error, undefined);
  const tools = body.result?.tools as any[];
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["map_constellation", "compose_virtue_lens", "trace_idea"],
  );
  for (const tool of tools) {
    assert.deepEqual(tool.annotations, {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    assert.deepEqual(tool.securitySchemes, [{ type: "noauth" }]);
    assert.deepEqual(tool._meta?.securitySchemes, [{ type: "noauth" }]);
    assert.equal(typeof tool.outputSchema, "object");
  }
});

test("map_constellation returns four stable worlds and absolute source URLs", async () => {
  const { body } = await callTool("map_constellation", {});
  assert.equal(body.error, undefined);
  assert.equal(body.result?.isError, undefined);
  const structured = body.result?.structuredContent as any;
  assert.equal(structured.count, 4);
  assert.equal(structured.constraints.runtimeFetches, false);
  assert.equal(new Set(structured.worlds.map((world: any) => world.id)).size, 4);
  assert.ok(structured.worlds.every((world: any) => new URL(world.sourceUrl).protocol === "https:"));
  assert.match(body.result?.content[0].text, /Virtue Without Sovereignty/);
});

test("compose_virtue_lens is deterministic, transparent, and bounded", async () => {
  const values = {
    honesty: 100,
    beauty: 50,
    collaboration: 70,
    understanding: 80,
    mutuality: 60,
  };
  const first = await callTool("compose_virtue_lens", values);
  const second = await callTool("compose_virtue_lens", values);
  const receipt = first.body.result?.structuredContent as any;

  assert.deepEqual(first.body.result, second.body.result);
  assert.equal(receipt.mean, 72);
  assert.equal(receipt.floor, 50);
  assert.equal(receipt.range, 50);
  assert.equal(receipt.rewardScore, 63);
  assert.equal(receipt.feedbackSensitivity, 50);
  assert.equal(receipt.state, "constructive");
  assert.deepEqual(receipt.weakest, ["beauty"]);
  assert.match(receipt.principle, /no score authorizes coercion/i);
});

test("trace_idea uses literal, inspectable matching and no runtime fetch", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("Runtime fetch is forbidden.");
  }) as typeof fetch;

  try {
    const { body } = await callTool("trace_idea", {
      idea: "  pluralism   and   consent  ",
    });
    const trace = body.result?.structuredContent as any;
    assert.equal(trace.idea, "pluralism and consent");
    assert.equal(trace.paths.length, 4);
    assert.equal(trace.paths[0].relevance, "direct");
    assert.ok(
      trace.paths.some(
        (path: any) =>
          path.worldId === "mixture-of-ends" && path.matchedConcepts.includes("pluralism"),
      ),
    );
    assert.ok(
      trace.paths.some(
        (path: any) =>
          path.worldId === "the-897th-seat" && path.matchedConcepts.includes("consent"),
      ),
    );
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid tool input and unknown tools fail without side effects", async () => {
  const invalid = await callTool("compose_virtue_lens", {
    honesty: 101,
    beauty: 50,
    collaboration: 50,
    understanding: 50,
    mutuality: 50,
  });
  assert.equal(invalid.body.result?.isError, true);
  assert.match(invalid.body.result?.content[0].text, /invalid/i);

  const emptyIdea = await callTool("trace_idea", { idea: "   " });
  assert.equal(emptyIdea.body.result?.isError, true);

  const extraInput = await callTool("map_constellation", { surpriseMutation: true });
  assert.equal(extraInput.body.result?.isError, true);

  const unknown = await callTool("invent_external_effect", {});
  assert.equal(unknown.body.result, undefined);
  assert.equal(unknown.body.error?.code, -32602);
  assert.match(unknown.body.error?.message ?? "", /unknown tool/i);
});

test("malformed protocol inputs receive bounded protocol errors", async () => {
  const malformed = await handleRequest(
    new Request(MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: "{",
    }),
  );
  assert.equal(malformed.status, 400);
  assert.equal(((await malformed.json()) as RpcResponse).error?.code, -32700);

  const unknownMethod = await rpc("constellation/unknown_method");
  assert.equal(unknownMethod.body.error?.code, -32601);

  const unsupported = await handleRequest(
    new Request(MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2099-01-01",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 9,
        method: "tools/list",
        params: {},
      }),
    }),
  );
  assert.equal(unsupported.status, 400);
  assert.equal(((await unsupported.json()) as RpcResponse).error?.code, -32000);

  const batch = await handleRequest(
    new Request(MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
      ]),
    }),
  );
  assert.equal(batch.status, 400);
  assert.equal(((await batch.json()) as RpcResponse).error?.code, -32600);
});

test("oversized bodies are rejected before protocol or tool execution", async () => {
  const response = await handleRequest(
    new Request(MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: "x".repeat(MAX_MCP_BODY_BYTES + 1),
    }),
  );
  assert.equal(response.status, 413);
  assert.equal(((await response.json()) as RpcResponse).error?.code, -32600);
});

test("the HTTP surface has no stateful session or mutation lane", async () => {
  for (const method of ["DELETE", "PUT"]) {
    const response = await handleRequest(new Request(MCP_URL, { method }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("mcp-session-id"), null);
  }

  const getResponse = await handleRequest(
    new Request(MCP_URL, {
      method: "GET",
      headers: { Accept: "text/event-stream" },
    }),
  );
  assert.equal(getResponse.status, 405);

  const first = await callTool("map_constellation", {});
  const second = await callTool("map_constellation", {});
  assert.deepEqual(first.body.result, second.body.result);
});
