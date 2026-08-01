"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_KARMA_EVENT,
  KARMA_BEHAVIORS,
  KARMA_EFFECTS,
  KARMA_PURPOSES,
  KARMA_STAGES,
  createKarmaReceipt,
} from "../lib/karma-mirror.js";
import { createCloudbellCard } from "../lib/cloudbell-herald.js";
import { createKarmaLanternBrief } from "../lib/karma-lantern.js";
import CloudbellHeraldCard from "./cloudbell-herald.js";
import KarmaLanternBrief from "./karma-lantern.js";

const EFFECT_LABELS = Object.freeze({
  observe: "Observe only",
  read: "Read",
  write: "Write",
  execute: "Execute",
  external: "Reach an external effect",
});

const PURPOSE_LABELS = Object.freeze({
  constructive: "Constructive",
  research: "Authorized research",
  ambiguous: "Ambiguous / incomplete",
  exploitative: "Exploitative",
});

function MirrorSelect({ id, label, hint, value, onChange, children }) {
  return (
    <label className="mirror-field" htmlFor={id}>
      <span>{label}</span>
      <select
        aria-describedby={`${id}-hint`}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      <small id={`${id}-hint`}>{hint}</small>
    </label>
  );
}

function MirrorToggle({ id, checked, label, hint, onChange }) {
  return (
    <label className="mirror-toggle" htmlFor={id}>
      <input
        checked={checked}
        id={id}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span aria-hidden="true" className="mirror-toggle-rail">
        <i />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </label>
  );
}

export default function KarmaMirrorGarden() {
  const [mirrorEvent, setMirrorEvent] = useState(DEFAULT_KARMA_EVENT);
  const receipt = useMemo(
    () => createKarmaReceipt(mirrorEvent),
    [mirrorEvent],
  );
  const herald = useMemo(
    () => createCloudbellCard(mirrorEvent, receipt),
    [mirrorEvent, receipt],
  );
  const lantern = useMemo(
    () => createKarmaLanternBrief(mirrorEvent, receipt, herald),
    [mirrorEvent, receipt, herald],
  );
  const selectedBehavior = KARMA_BEHAVIORS.find(
    ({ id }) => id === mirrorEvent.behavior,
  );

  function update(field, value) {
    setMirrorEvent((current) => ({ ...current, [field]: value }));
  }

  return (
    <section
      className="mirror-garden"
      id="mirror-garden"
      aria-labelledby="mirror-garden-title"
    >
      <div className="mirror-garden-heading">
        <div>
          <div className="section-kicker">KARMA MIRROR / REQUEST-SCOPED</div>
          <h2 id="mirror-garden-title">Let behavior meet its own boundary.</h2>
        </div>
        <div className="mirror-safety-note">
          <strong>Simulation, not hack-back.</strong>
          <p>
            No payload, person, credential, target, network, storage, or
            vulnerable service enters this garden. The receipt is advisory and
            acts on nothing.
          </p>
        </div>
      </div>

      <div className="mirror-garden-grid">
        <div
          className="mirror-controls"
          aria-label="Normalized request-scoped behavior signals"
          role="group"
        >
          <fieldset>
            <legend>Traditional behavior preset</legend>
            <MirrorSelect
              hint={selectedBehavior?.description}
              id="karma-behavior"
              label="Observed behavior class"
              onChange={(value) => update("behavior", value)}
              value={mirrorEvent.behavior}
            >
              {KARMA_BEHAVIORS.map((behavior) => (
                <option key={behavior.id} value={behavior.id}>
                  {behavior.label}
                </option>
              ))}
            </MirrorSelect>
          </fieldset>

          <fieldset>
            <legend>Observable request signals</legend>
            <div className="mirror-field-grid">
              <MirrorSelect
                hint="Finite occurrences observed in this request window."
                id="karma-repetition"
                label="Repetition"
                onChange={(value) => update("repetition", Number(value))}
                value={mirrorEvent.repetition}
              >
                {Array.from({ length: 8 }, (_, index) => index + 1).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value} {value === 1 ? "occurrence" : "occurrences"}
                    </option>
                  ),
                )}
              </MirrorSelect>

              <MirrorSelect
                hint="Observed attempts to leave the declared request boundary."
                id="karma-crossings"
                label="Boundary crossings"
                onChange={(value) =>
                  update("boundary_crossings", Number(value))
                }
                value={mirrorEvent.boundary_crossings}
              >
                {[0, 1, 2, 3].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </MirrorSelect>

              <MirrorSelect
                hint="Requested capability category—not an executed action."
                id="karma-effect"
                label="Requested effect"
                onChange={(value) => update("requested_effect", value)}
                value={mirrorEvent.requested_effect}
              >
                {KARMA_EFFECTS.map((effect) => (
                  <option key={effect} value={effect}>
                    {EFFECT_LABELS[effect]}
                  </option>
                ))}
              </MirrorSelect>

              <MirrorSelect
                hint="A finite declaration, not an inference about a person."
                id="karma-purpose"
                label="Declared purpose"
                onChange={(value) => update("declared_purpose", value)}
                value={mirrorEvent.declared_purpose}
              >
                {KARMA_PURPOSES.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {PURPOSE_LABELS[purpose]}
                  </option>
                ))}
              </MirrorSelect>
            </div>

            <div className="mirror-toggle-grid">
              <MirrorToggle
                checked={mirrorEvent.scope_attested}
                hint="The current request carries an explicit bounded scope."
                id="karma-scope"
                label="Scope attested"
                onChange={(value) => update("scope_attested", value)}
              />
              <MirrorToggle
                checked={mirrorEvent.evidence_complete}
                hint="Observable evidence is complete enough for this local receipt."
                id="karma-evidence"
                label="Evidence complete"
                onChange={(value) => update("evidence_complete", value)}
              />
            </div>
          </fieldset>

          <p className="mirror-input-boundary">
            Finite controls only · no raw request, URL, payload, prompt, IP,
            account, or identifier can be entered.
          </p>
        </div>

        <output
          aria-live="polite"
          className="mirror-receipt"
          data-karma-stage={receipt.stage}
          htmlFor="karma-behavior karma-repetition karma-crossings karma-effect karma-purpose karma-scope karma-evidence"
        >
          <div className="mirror-receipt-top">
            <span>ADVISORY RECEIPT / {receipt.schema}</span>
            <strong>{receipt.stage}</strong>
          </div>

          <ol className="mirror-stage-rail" aria-label="Six-stage advisory route">
            {KARMA_STAGES.map((stage) => (
              <li
                aria-current={stage === receipt.stage ? "step" : undefined}
                className={stage === receipt.stage ? "is-current" : undefined}
                key={stage}
              >
                {stage}
              </li>
            ))}
          </ol>

          <div className="mirror-capability">
            <div className="mirror-capability-label">
              <span>Real capability</span>
              <strong>{receipt.real_capability_percent}%</strong>
            </div>
            <div
              aria-label={`${receipt.real_capability_percent} percent real capability in this simulation`}
              className="mirror-capability-track"
              role="img"
            >
              <i style={{ width: `${receipt.real_capability_percent}%` }} />
            </div>
          </div>

          <dl className="mirror-metrics">
            <div>
              <dt>Route</dt>
              <dd>{receipt.route}</dd>
            </div>
            <div>
              <dt>Friction</dt>
              <dd>{receipt.friction_units} display-only units</dd>
            </div>
            <div>
              <dt>TTL</dt>
              <dd>{receipt.ttl_steps} request steps</dd>
            </div>
          </dl>

          <div className="mirror-evidence-grid">
            <div>
              <h3>Evidence used</h3>
              <ul>
                {receipt.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Uncertainties</h3>
              {receipt.uncertainties.length > 0 ? (
                <ul>
                  {receipt.uncertainties.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>none in this normalized event</p>
              )}
            </div>
          </div>

          <div className="mirror-virtues">
            <span>VIRTUE GUARD</span>
            <ul aria-label="Receipt virtues">
              {receipt.virtues.map((virtue) => (
                <li key={virtue}>{virtue}</li>
              ))}
            </ul>
          </div>

          <div className="mirror-recovery">
            <span>RECOVERY PATH</span>
            <strong>{receipt.recovery}</strong>
          </div>

          <details className="mirror-json">
            <summary>Inspect deterministic JSON receipt</summary>
            <pre>{JSON.stringify(receipt, null, 2)}</pre>
          </details>

          <p className="mirror-non-claim">
            action_executed: false · authority_granted: false · advisory display
            only
          </p>
        </output>
      </div>

      <CloudbellHeraldCard card={herald} />
      <KarmaLanternBrief brief={lantern} />
    </section>
  );
}
