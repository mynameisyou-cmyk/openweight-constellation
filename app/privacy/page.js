import { ArrowLeft } from "../mcp/shared.js";

export const metadata = {
  title: "Privacy",
  description: "Privacy boundary for the Openweight Constellation.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <a href="/">
        <ArrowLeft /> Return to the constellation
      </a>
      <h1>Privacy without a shadow profile.</h1>
      <p>
        The Openweight Constellation is a public, informational instrument. Its
        application code does not create accounts, set cookies, use browser
        storage, run application analytics, call an AI model, or collect form
        submissions.
      </p>

      <h2>What the virtue instrument processes</h2>
      <p>
        The five slider values you choose are processed in your browser. They
        are not sent to the hub. Copying a receipt writes the deterministic
        result to your own clipboard only when you press the button.
      </p>

      <h2>What the MCP endpoint processes</h2>
      <p>
        The public MCP service accepts only the explicit tool arguments
        described in its schemas and returns deterministic public information.
        It has no database, identity layer, durable memory, model connection,
        or write-capable tool. Do not send personal or secret information in
        tool arguments.
      </p>

      <h2>Hosting infrastructure</h2>
      <p>
        Infrastructure providers may process ordinary request metadata—such as
        an IP address, user agent, path, and timing—to deliver and secure the
        service. This project does not add an analytics or advertising layer on
        top of that infrastructure.
      </p>

      <h2>External worlds</h2>
      <p>
        Links to the four public mirror sites open separate deployments. Their
        infrastructure boundaries apply once you follow those links.
      </p>
      <p>
        One small music pill near the foot of each page is an embedded frame
        served from Hugging Face Spaces (開心會 chill-fi). Loading it is an
        ordinary request to that host with no referrer sent; it never plays
        until you press play, and this site reads nothing back from it.
      </p>

      <h2>Contact and changes</h2>
      <p>
        This is an experimental public artifact, not a service account or data
        controller portal. Material changes to its data behavior should be
        reflected on this page before deployment.
      </p>
    </main>
  );
}
