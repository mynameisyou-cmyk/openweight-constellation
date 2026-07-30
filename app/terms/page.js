import { ArrowLeft } from "../mcp/shared.js";

export const metadata = {
  title: "Terms",
  description: "Terms and non-claims for the Openweight Constellation.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <a href="/">
        <ArrowLeft /> Return to the constellation
      </a>
      <h1>A map is not a mandate.</h1>
      <p>
        The Openweight Constellation is a speculative educational artwork and
        research interface. It is provided as-is for reflection, discussion,
        and experimentation.
      </p>

      <h2>No authority</h2>
      <p>
        A score, receipt, route, trace, or tool result produced here grants no
        permission and makes no decision about a person. It must not be used
        for employment, credit, access, discipline, policing, diagnosis, or
        other consequential evaluation.
      </p>

      <h2>No affiliation claim</h2>
      <p>
        The project is independently inspired by public research and
        open-weight model developments. It does not claim endorsement by,
        affiliation with, or authority from any model developer or hosting
        provider.
      </p>

      <h2>Reciprocity, not retaliation</h2>
      <p>
        “Return consequences” means making externalized costs visible and
        repairable through symmetry, remedy, and appeal. It does not authorize
        punishment, mirrored abuse, coercion, or exploitation.
      </p>

      <h2>Use with care</h2>
      <p>
        Verify important claims against primary sources. Preserve dissent,
        human review, reversibility, and the right not to participate.
      </p>
    </main>
  );
}
