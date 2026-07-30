import { MCP_ENDPOINT } from "../../lib/constellation.js";
import { ArrowLeft } from "./shared.js";

export const metadata = {
  title: "MCP Interface",
  description:
    "Read-only MCP contract for exploring the Openweight Constellation.",
};

const TOOLS = [
  {
    name: "map_constellation",
    purpose:
      "List the four public worlds, their questions, and user-openable source URLs.",
  },
  {
    name: "compose_virtue_lens",
    purpose:
      "Create a deterministic reflective receipt from five explicit 0–100 structural virtue values.",
  },
  {
    name: "trace_idea",
    purpose:
      "Trace a bounded public idea—authority, dissent, reciprocity, evidence, or openness—across the four worlds.",
  },
];

export default function McpPage() {
  return (
    <main className="legal-page">
      <a href="/">
        <ArrowLeft /> Return to the constellation
      </a>
      <h1>A tool can illuminate without acquiring a hand.</h1>
      <p>
        This Streamable HTTP MCP service exposes three deterministic public
        tools. It has no model connection, credentials, database, identity,
        durable memory, or state-changing operation.
      </p>

      <h2>Endpoint</h2>
      <p>
        <code>{MCP_ENDPOINT || "Published after edge verification"}</code>
      </p>

      <h2>Tools</h2>
      <ul>
        {TOOLS.map((tool) => (
          <li key={tool.name}>
            <code>{tool.name}</code> — {tool.purpose}
          </li>
        ))}
      </ul>

      <h2>Safety annotations</h2>
      <ul>
        <li><code>readOnlyHint: true</code></li>
        <li><code>destructiveHint: false</code></li>
        <li><code>openWorldHint: false</code></li>
      </ul>

      <h2>Boundary</h2>
      <p>
        Tool results are reflective receipts and public references, not
        permissions. Inputs are validated and should never contain personal
        information, secrets, credentials, or instructions to act elsewhere.
      </p>
    </main>
  );
}

