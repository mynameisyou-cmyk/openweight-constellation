"use client";

function LanternLabel({ children }) {
  return <span className="lantern-label">{children}</span>;
}

function SignalList({ values }) {
  return (
    <dl className="lantern-signal-list">
      {Object.entries(values).map(([key, value]) => (
        <div key={key}>
          <dt>{key.replaceAll("_", " ")}</dt>
          <dd>{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function KarmaLanternBrief({ brief }) {
  const truth = brief.truth_receipt;
  const action = brief.action_card;
  const learning = brief.learning_seed;

  return (
    <article
      aria-labelledby="karma-lantern-title"
      className="karma-lantern"
      data-lantern-epistemic={truth.epistemic_id}
      data-lantern-stage={brief.source_stage}
    >
      <header className="lantern-header">
        <div className="lantern-heading">
          <div aria-hidden="true" className="lantern-mark">
            <span />
          </div>
          <div>
            <div className="section-kicker">INCIDENT LEGIBILITY / NO LIVE TRAFFIC</div>
            <h3 id="karma-lantern-title">{brief.ability_name}</h3>
            <p>{brief.headline}</p>
          </div>
        </div>
        <div className="lantern-status">
          <LanternLabel>EPISTEMIC STATE</LanternLabel>
          <strong>{truth.epistemic_title}</strong>
          <span>{brief.source_stage} · explanatory only</span>
        </div>
      </header>

      <ol className="lantern-causal-rail" aria-label="Six-step incident learning rail">
        {brief.causal_rail.map((step, index) => (
          <li data-lantern-state={step.state} key={step.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            <small>{step.description}</small>
            <i>{step.state}</i>
          </li>
        ))}
      </ol>

      <div className="lantern-panels">
        <section aria-labelledby="lantern-truth-title" className="lantern-panel lantern-truth">
          <header>
            <LanternLabel>01 / TRUTH RECEIPT</LanternLabel>
            <h4 id="lantern-truth-title">Separate what is known.</h4>
          </header>
          <div className="lantern-epistemic">
            <strong>{truth.epistemic_title}</strong>
            <p>{truth.epistemic_explanation}</p>
          </div>
          <div className="lantern-truth-grid">
            <div>
              <LanternLabel>NORMALIZED SIGNALS</LanternLabel>
              <SignalList values={truth.normalized_signals} />
            </div>
            <div>
              <LanternLabel>DECLARATIONS</LanternLabel>
              <SignalList values={truth.declarations} />
            </div>
          </div>
          <div className="lantern-glossary">
            <LanternLabel>POLICY TRACE · DERIVED, NOT RAW EVIDENCE</LanternLabel>
            <ul>
              {truth.policy_trace.map((item) => (
                <li key={item.token}>
                  <code>{item.token}</code>
                  <span>{item.explanation}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lantern-uncertainty">
            <LanternLabel>VISIBLE UNCERTAINTY</LanternLabel>
            {truth.uncertainties.length > 0 ? (
              <ul>
                {truth.uncertainties.map((item) => (
                  <li key={item.token}>
                    <code>{item.token}</code>
                    <span>{item.explanation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No uncertainty token is present in this normalized event.</p>
            )}
          </div>
          <div className="lantern-unknowns">
            <LanternLabel>EXPLICIT UNKNOWNS</LanternLabel>
            <ul>
              {truth.explicit_unknowns.map((unknown) => (
                <li key={unknown}>{unknown}</li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="lantern-action-title" className="lantern-panel lantern-action">
          <header>
            <LanternLabel>02 / ACTION CARD · PROPOSED ONLY</LanternLabel>
            <h4 id="lantern-action-title">Make the next review legible.</h4>
          </header>
          <div className="lantern-review-posture">
            <div>
              <LanternLabel>SUGGESTED REVIEW ROLE</LanternLabel>
              <strong>{action.suggested_review_role_title}</strong>
            </div>
            <div>
              <LanternLabel>REVIEW POSTURE · NOT A TIMER</LanternLabel>
              <strong>{action.review_priority_title}</strong>
              <p>{action.review_priority_explanation}</p>
            </div>
          </div>
          <dl className="lantern-advisory-metrics">
            <div>
              <dt>Advisory route</dt>
              <dd>{action.advisory_route}</dd>
            </div>
            <div>
              <dt>Advisory capability</dt>
              <dd>{action.advisory_capability_percent}%</dd>
            </div>
            <div>
              <dt>Display friction</dt>
              <dd>{action.display_friction_units} units</dd>
            </div>
            <div>
              <dt>Advisory recovery steps</dt>
              <dd>{action.advisory_recovery_steps} steps</dd>
            </div>
          </dl>
          <div className="lantern-options">
            <LanternLabel>THREE REVERSIBLE OPTIONS · HUMAN DECISION REQUIRED</LanternLabel>
            <ol>
              {action.options.map((option, index) => (
                <li key={option.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{option.label}</strong>
                    <p>{option.reason}</p>
                    <small>reversible: {String(option.reversible)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lantern-escalation">
            <LanternLabel>CONDITIONS FOR FRESH HUMAN REVIEW</LanternLabel>
            <ul>
              {action.human_escalation_prompts.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="lantern-learning-title" className="lantern-panel lantern-learning">
          <header>
            <LanternLabel>03 / LEARNING SEED · OPEN</LanternLabel>
            <h4 id="lantern-learning-title">Turn one event into better boundaries.</h4>
          </header>
          <p className="lantern-lesson-id">{learning.lesson_class_id}</p>
          <div className="lantern-learning-block">
            <LanternLabel>REGRESSION TARGETS</LanternLabel>
            <ul>
              {learning.regression_targets.map((target) => (
                <li key={target}>{target}</li>
              ))}
            </ul>
          </div>
          <div className="lantern-learning-block">
            <LanternLabel>ARCHITECTURE QUESTIONS</LanternLabel>
            <ol>
              {learning.architecture_questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
          <div className="lantern-learning-block lantern-closure">
            <LanternLabel>CLOSURE REQUIREMENTS · STATUS {learning.closure_status}</LanternLabel>
            <ul>
              {learning.closure_requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>
          <p className="lantern-future-use">
            future_use: {learning.future_use} · automatic_test_creation: false ·
            automatic_policy_mutation: false · persistent_storage: false
          </p>
        </section>
      </div>

      <div className="lantern-recovery">
        <LanternLabel>EXACT RECOVERY PATH</LanternLabel>
        <strong>{brief.recovery}</strong>
      </div>

      <footer className="lantern-boundary">
        <span>behavior_not_person: true</span>
        <span>policy_values_advisory_only: true</span>
        <span>human_decision_required: true</span>
        <span>live_ingestion: false</span>
        <span>automatic_response: false</span>
        <span>network_calls: false</span>
        <span>storage_writes: false</span>
        <span>action_executed: false</span>
        <span>authority_granted: false</span>
      </footer>
    </article>
  );
}
