import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { SOURCE_URLS, TOOL_NAMES } from "./constellation.ts";
import { createConstellationServer } from "./server.ts";

export const MAX_MCP_BODY_BYTES = 16_384;

export const ALLOWED_ORIGINS = new Set([
  ...SOURCE_URLS,
  "https://openweight-constellation.vercel.app",
  "https://chatgpt.com",
  "https://chat.openai.com",
  "http://localhost:3000",
]);

const PUBLIC_HEADERS = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Accept, Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
} as const;

const SAFETY_HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const;

const MANIFEST = Object.freeze({
  schema: "openweight.constellation/mcp-manifest@1",
  name: "Openweight Constellation",
  version: "0.1.0",
  transport: "Streamable HTTP",
  endpoint: "/mcp",
  tools: [...TOOL_NAMES],
  constraints: {
    public: true,
    readOnly: true,
    deterministic: true,
    modelCalls: false,
    runtimeFetches: false,
    authentication: false,
    cookies: false,
    persistence: false,
    analytics: false,
    inputLogging: false,
    personalDataCollection: false,
    externalWrites: false,
    requestBodyLimitBytes: MAX_MCP_BODY_BYTES,
    batchRequests: false,
    platformRateLimitRequired: true,
  },
  allowedBrowserOrigins: [...ALLOWED_ORIGINS],
  sourceUrls: [...SOURCE_URLS],
});

function jsonResponse(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const [name, value] of Object.entries(SAFETY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(JSON.stringify(value), { ...init, headers });
}

function withPublicHeaders(response: Response, allowedOrigin?: string): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(PUBLIC_HEADERS)) {
    headers.set(name, value);
  }
  if (allowedOrigin !== undefined) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
  } else {
    headers.delete("Access-Control-Allow-Origin");
  }
  for (const [name, value] of Object.entries(SAFETY_HEADERS)) {
    headers.set(name, value);
  }
  headers.delete("Set-Cookie");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function methodNotAllowed(allow: string): Response {
  return jsonResponse(
    {
      error: "method_not_allowed",
      message: `Allowed methods: ${allow}.`,
    },
    {
      status: 405,
      headers: { Allow: allow },
    },
  );
}

function jsonRpcError(
  code: number,
  message: string,
  id: string | number | null,
  status = 200,
): Response {
  return jsonResponse(
    {
      jsonrpc: "2.0",
      error: { code, message },
      id,
    },
    { status },
  );
}

function validateOrigin(request: Request): { allowedOrigin?: string; error?: Response } {
  const origin = request.headers.get("Origin");
  if (origin === null) {
    return {};
  }

  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !ALLOWED_ORIGINS.has(origin)) {
      return {
        error: jsonRpcError(-32000, "Forbidden: unapproved Origin.", null, 403),
      };
    }
  } catch {
    return {
      error: jsonRpcError(-32000, "Forbidden: unapproved Origin.", null, 403),
    };
  }

  return { allowedOrigin: origin };
}

async function readBoundedBody(
  request: Request,
): Promise<{ body?: Uint8Array; error?: Response }> {
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (
      !Number.isSafeInteger(parsedLength) ||
      parsedLength < 0 ||
      parsedLength > MAX_MCP_BODY_BYTES
    ) {
      return {
        error: jsonRpcError(-32600, "Request body exceeds the 16384-byte limit.", null, 413),
      };
    }
  }

  if (request.body === null) {
    return { body: new Uint8Array() };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      length += value.byteLength;
      if (length > MAX_MCP_BODY_BYTES) {
        await reader.cancel();
        return {
          error: jsonRpcError(-32600, "Request body exceeds the 16384-byte limit.", null, 413),
        };
      }
      chunks.push(value);
    }
  } catch {
    return {
      error: jsonRpcError(-32700, "Unable to read request body.", null, 400),
    };
  }

  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body };
}

function inspectEnvelope(body: Uint8Array): Response | undefined {
  let message: unknown;
  try {
    message = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return undefined;
  }

  if (Array.isArray(message)) {
    return jsonRpcError(-32600, "Batch requests are not supported.", null, 400);
  }

  if (
    typeof message !== "object" ||
    message === null ||
    !("method" in message) ||
    (message as { method?: unknown }).method !== "tools/call"
  ) {
    return undefined;
  }

  const candidate = message as {
    id?: unknown;
    params?: { name?: unknown };
  };
  if (
    !Object.prototype.hasOwnProperty.call(candidate, "id") ||
    typeof candidate.params?.name !== "string"
  ) {
    return undefined;
  }

  if (!(TOOL_NAMES as readonly string[]).includes(candidate.params.name)) {
    const id =
      typeof candidate.id === "string" || typeof candidate.id === "number"
        ? candidate.id
        : null;
    return jsonRpcError(-32602, "Unknown tool.", id);
  }

  return undefined;
}

function isToolsListRequest(body: Uint8Array): boolean {
  try {
    const message = JSON.parse(new TextDecoder().decode(body)) as {
      method?: unknown;
    };
    return (
      !Array.isArray(message) &&
      typeof message === "object" &&
      message !== null &&
      message.method === "tools/list"
    );
  } catch {
    return false;
  }
}

/**
 * MCP SDK v1.30 serializes arbitrary tool `_meta` but does not yet project the
 * Apps extension's top-level `securitySchemes`. Add the official no-auth field
 * to the wire catalog while retaining `_meta.securitySchemes` for back-compat.
 */
async function addNoAuthToolSchemes(
  response: Response,
  requestBody: Uint8Array,
): Promise<Response> {
  if (!isToolsListRequest(requestBody) || response.status !== 200) {
    return response;
  }

  const fallback = response.clone();
  try {
    const payload = (await response.json()) as {
      result?: { tools?: Array<Record<string, unknown>> };
    };
    if (!Array.isArray(payload.result?.tools)) {
      return fallback;
    }
    for (const tool of payload.result.tools) {
      tool.securitySchemes = [{ type: "noauth" }];
    }
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify(payload), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return fallback;
  }
}

async function handleMcp(request: Request): Promise<Response> {
  const origin = validateOrigin(request);
  if (origin.error !== undefined) {
    return withPublicHeaders(origin.error);
  }

  if (request.method === "OPTIONS") {
    return withPublicHeaders(new Response(null, { status: 204 }), origin.allowedOrigin);
  }

  if (request.method !== "POST") {
    return withPublicHeaders(methodNotAllowed("POST, OPTIONS"), origin.allowedOrigin);
  }

  const bounded = await readBoundedBody(request);
  if (bounded.error !== undefined) {
    return withPublicHeaders(bounded.error, origin.allowedOrigin);
  }
  const body = bounded.body ?? new Uint8Array();
  const envelopeError = inspectEnvelope(body);
  if (envelopeError !== undefined) {
    return withPublicHeaders(envelopeError, origin.allowedOrigin);
  }

  const headers = new Headers(request.headers);
  headers.delete("Content-Length");
  const boundedRequest = new Request(request.url, {
    method: "POST",
    headers,
    body,
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    eventStore: undefined,
  });
  const server = createConstellationServer();

  try {
    await server.connect(transport);
    const protocolResponse = await transport.handleRequest(boundedRequest);
    return withPublicHeaders(
      await addNoAuthToolSchemes(protocolResponse, body),
      origin.allowedOrigin,
    );
  } finally {
    await server.close();
  }
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/mcp") {
    return handleMcp(request);
  }

  if (url.pathname === "/health") {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return withPublicHeaders(methodNotAllowed("GET, HEAD"));
    }
    const response = jsonResponse({
      status: "ok",
      service: "openweight-constellation",
      version: "0.1.0",
      readOnly: true,
      persistence: false,
    });
    return withPublicHeaders(
      request.method === "HEAD"
        ? new Response(null, { status: response.status, headers: response.headers })
        : response,
    );
  }

  if (url.pathname === "/manifest.json") {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return withPublicHeaders(methodNotAllowed("GET, HEAD"));
    }
    const response = jsonResponse(MANIFEST);
    return withPublicHeaders(
      request.method === "HEAD"
        ? new Response(null, { status: response.status, headers: response.headers })
        : response,
    );
  }

  if (request.method === "OPTIONS") {
    return withPublicHeaders(new Response(null, { status: 204 }));
  }

  return withPublicHeaders(
    jsonResponse(
      {
        error: "not_found",
        routes: ["/health", "/manifest.json", "/mcp"],
      },
      { status: 404 },
    ),
  );
}

export default {
  fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
} satisfies ExportedHandler;
