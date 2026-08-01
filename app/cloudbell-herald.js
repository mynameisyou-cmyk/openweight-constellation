"use client";

import { CLOUDBELL_LEXICON } from "../lib/cloudbell-herald.js";


export default function CloudbellHeraldCard({ card }) {
  const mascot = CLOUDBELL_LEXICON.mascot;

  return (
    <article
      aria-labelledby="cloudbell-card-title"
      className="cloudbell-card"
      data-cloudbell-signature={card.signature_id}
      data-cloudbell-stage={card.karma_stage}
    >
      <header className="cloudbell-header">
        <div>
          <div className="section-kicker">OWNED-SURFACE HERALD / NO POSTING</div>
          <p className="cloudbell-protocol">{card.protocol_name}</p>
        </div>
        <div className="cloudbell-stage" aria-label={`KARMA stage ${card.karma_stage}`}>
          <span>{card.karma_stage}</span>
          <strong>{card.stage_title}</strong>
        </div>
      </header>

      <div className="cloudbell-body">
        <div className="cloudbell-mascot-panel">
          <div aria-hidden="true" className="bingle">
            <span className="bingle-ribbon bingle-ribbon-one" />
            <span className="bingle-ribbon bingle-ribbon-two" />
            <span className="bingle-cloud">
              <i className="bingle-crenel bingle-crenel-one" />
              <i className="bingle-crenel bingle-crenel-two" />
              <i className="bingle-crenel bingle-crenel-three" />
              <i className="bingle-eye bingle-eye-one" />
              <i className="bingle-eye bingle-eye-two" />
              <i className="bingle-window" />
            </span>
            <span className="bingle-tail" />
          </div>
          <div>
            <span className="cloudbell-label">FICTIONAL MASCOT</span>
            <h3 id="cloudbell-card-title">{card.mascot_name}</h3>
            <p>{card.mascot_catchphrase}</p>
          </div>
          <p className="cloudbell-origin">{mascot.origin}</p>
          <p className="cloudbell-inevitable">{mascot.why_inevitable}</p>
        </div>

        <div className="cloudbell-signal-panel" aria-live="polite">
          <div className="cloudbell-window" aria-label="One fictional castle window lit">
            <span aria-hidden="true" className="cloudbell-window-light" />
            <span>{card.display_effect}</span>
          </div>
          <span className="cloudbell-label">BEHAVIOR SIGNATURE · NOT A PERSON</span>
          <div className="cloudbell-signature-heading">
            <span className="cloudbell-mark">
              {card.signature_mark}
            </span>
            <h3>{card.signature_name}</h3>
          </div>
          <p className="cloudbell-mechanism">{card.mechanism}</p>
          <blockquote>{card.banner}</blockquote>
        </div>
      </div>

      <div className="cloudbell-refrain">
        <span className="cloudbell-label">THE CLOUD BELL RINGS</span>
        <strong>{card.refrain}</strong>
      </div>

      <div className="cloudbell-lower-grid">
        <div className="cloudbell-recovery">
          <span className="cloudbell-label">EXACT RECOVERY PATH</span>
          <strong>{card.recovery}</strong>
        </div>
        <div className="cloudbell-share">
          <span className="cloudbell-label">OPT-IN SHARE COPY · TEXT ONLY</span>
          <p>{card.share_text}</p>
          <small>{card.share_instruction}</small>
        </div>
      </div>

      <footer className="cloudbell-footer">
        <span>behavior_not_person: true</span>
        <span>owned_surface_only: true</span>
        <span>automatic_posting: false</span>
        <span>forced_propagation: false</span>
        <span>external_delivery: false</span>
        <span>action_executed: false</span>
      </footer>
    </article>
  );
}
