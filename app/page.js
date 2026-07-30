"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_VIRTUES,
  MCP_ENDPOINT,
  VIRTUES,
  WORLDS,
  composeVirtueReceipt,
  scoreVirtues,
} from "../lib/constellation.js";

const JOURNEY = [
  "question",
  "lenses",
  "ends",
  "institution",
  "human key",
  "receipt",
  "return",
];

const COVENANT = [
  "Capability is not authority.",
  "Many voices are not automatically independent evidence.",
  "Dissent survives synthesis.",
  "A receipt is not permission.",
  "Reward evaluates contributions, never persons.",
];

const JOKES = [
  "The router requested a second opinion. It received 896, activated 16, and still had to ask a human.",
  "I asked the model to touch grass. It opened a landscaping benchmark.",
  "The constitution had a race condition, so the dissenting opinion won on a technicality.",
  "Our alignment meeting aligned perfectly on the need for another alignment meeting.",
];

function Arrow({ compact = false }) {
  return (
    <svg
      aria-hidden="true"
      className={compact ? "arrow arrow-compact" : "arrow"}
      viewBox="0 0 24 24"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function ExternalArrow() {
  return (
    <svg aria-hidden="true" className="external-arrow" viewBox="0 0 20 20">
      <path d="M7 4h9v9M16 4 6 14" />
    </svg>
  );
}

function RangeControl({ virtue, value, onChange }) {
  return (
    <label className="virtue-control">
      <span className="virtue-label">
        <span>{virtue.label}</span>
        <strong>{value}</strong>
      </span>
      <input
        aria-describedby={`${virtue.id}-hint`}
        data-virtue={virtue.id}
        max="100"
        min="0"
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
      <small id={`${virtue.id}-hint`}>{virtue.hint}</small>
    </label>
  );
}

function ConstellationDiagram() {
  return (
    <div className="constellation-diagram" aria-label="Four linked worlds around an empty center">
      <svg
        aria-hidden="true"
        className="constellation-lines"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d="M50 14 83 40 68 84 21 72 17 35Z" />
        <path d="M50 14 68 84M83 40 21 72M17 35 68 84" />
      </svg>
      <div className="empty-center">
        <span>NO</span>
        <strong>SOVEREIGN</strong>
        <small>the map is not the throne</small>
      </div>
      {WORLDS.map((world, index) => (
        <a
          className={`orbit-world orbit-world-${index + 1}`}
          href={world.url}
          key={world.id}
          rel="noreferrer"
          style={{ "--world-color": world.color }}
          target="_blank"
        >
          <span className="orbit-index">{world.number}</span>
          <strong>{world.shortTitle}</strong>
          <small>{world.accent}</small>
        </a>
      ))}
    </div>
  );
}

function PauseInstrument() {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [jokeIndex, setJokeIndex] = useState(0);
  const cycle = elapsed % 12;
  const phase = cycle < 4 ? "inhale" : cycle < 6 ? "hold" : "exhale";

  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => {
      setElapsed((current) => {
        if (current >= 35) {
          setActive(false);
          return 36;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (active) {
      document.documentElement.dataset.humanPause = "true";
    } else {
      delete document.documentElement.dataset.humanPause;
    }
    return () => {
      delete document.documentElement.dataset.humanPause;
    };
  }, [active]);

  function togglePause() {
    if (elapsed >= 36) setElapsed(0);
    setActive((current) => !current);
  }

  return (
    <section className="pause-panel" id="pause" aria-labelledby="pause-title">
      <div className="section-kicker">INTERMISSION / HUMAN RUNTIME</div>
      <div className="pause-layout">
        <div>
          <h2 id="pause-title">Stretch · breathe · joke · rest</h2>
          <p>
            A 36-second protocol for the substrate that is actually reading
            this. Decorative motion pauses while you breathe.
          </p>
          <div className="pause-actions">
            <button
              aria-pressed={active}
              className="primary-button"
              onClick={togglePause}
              type="button"
            >
              {active ? "Pause the pause" : elapsed >= 36 ? "Again, gently" : "Begin 36 seconds"}
            </button>
            <button
              className="text-button"
              onClick={() => setJokeIndex((current) => (current + 1) % JOKES.length)}
              type="button"
            >
              Rotate joke <Arrow compact />
            </button>
          </div>
        </div>
        <div className={`breath-orb ${active ? "is-breathing" : ""}`} data-phase={phase}>
          <span>{elapsed >= 36 ? "rest" : active ? phase : "ready"}</span>
          <strong>{active ? 36 - elapsed : "36"}</strong>
          <small>{active ? "seconds remain" : "seconds / no streak"}</small>
        </div>
      </div>
      <blockquote>{JOKES[jokeIndex]}</blockquote>
    </section>
  );
}

export default function Home() {
  const [virtues, setVirtues] = useState(DEFAULT_VIRTUES);
  const [copyState, setCopyState] = useState("Copy reflective receipt");
  const result = useMemo(() => scoreVirtues(virtues), [virtues]);
  const receipt = useMemo(() => composeVirtueReceipt(virtues), [virtues]);

  function updateVirtue(id, value) {
    setVirtues((current) => ({ ...current, [id]: value }));
    setCopyState("Copy reflective receipt");
  }

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
      setCopyState("Receipt copied · no authority carried");
    } catch {
      setCopyState("Copy unavailable · values remain local");
    }
  }

  return (
    <main className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to constellation
      </a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Openweight Constellation home">
          <span className="wordmark-sigil" aria-hidden="true">✣</span>
          <span>
            OPENWEIGHT
            <strong>CONSTELLATION</strong>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#worlds">Worlds</a>
          <a href="#virtue-loop">Virtue loop</a>
          <a href="#protocol">Protocol</a>
          <a href="#pause">Pause</a>
        </nav>
        <span className="header-status">
          <i aria-hidden="true" />
          public · local-first
        </span>
      </header>

      <div id="top" />
      <section className="hero" id="main-content">
        <div className="hero-copy">
          <div className="eyebrow">
            FOUR INSTRUMENTS FOR INTELLIGENCE AFTER THE SOVEREIGN MODEL
          </div>
          <h1>
            No single model
            <br />
            gets the <em>last word.</em>
          </h1>
          <p className="hero-lede">
            Route attention. Preserve ends. Divide authority. Return
            consequences. Four speculative civic worlds become one navigable
            commons—without becoming one ideology.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#worlds">
              Enter the constellation <Arrow compact />
            </a>
            <a className="secondary-button" href="#virtue-loop">
              Tune the KARMA loop
            </a>
          </div>
          <div className="hero-facts" aria-label="System facts">
            <span><strong>4</strong> worlds</span>
            <span><strong>0</strong> rulers</span>
            <span><strong>1</strong> empty seat</span>
          </div>
        </div>
        <ConstellationDiagram />
      </section>

      <div className="journey-rail" aria-label="Shared journey">
        {JOURNEY.map((step, index) => (
          <span key={step}>
            {step}
            {index < JOURNEY.length - 1 ? <Arrow compact /> : null}
          </span>
        ))}
      </div>

      <section className="worlds-section" id="worlds" aria-labelledby="worlds-title">
        <div className="section-heading">
          <div>
            <div className="section-kicker">THE FOUR STATIONS</div>
            <h2 id="worlds-title">Different instruments. Shared limits.</h2>
          </div>
          <p>
            Each world keeps its own constitution. The hub connects their
            questions, not their authority.
          </p>
        </div>

        <div className="world-grid">
          {WORLDS.map((world, index) => (
            <article
              className="world-card"
              key={world.id}
              style={{ "--world-color": world.color }}
            >
              <div className="world-card-top">
                <span>{world.number}</span>
                <span>{["ATTENTION", "ENDS", "POLITY", "COMMITMENT"][index]}</span>
              </div>
              <div className="world-orb" aria-hidden="true">
                <span>{index === 0 ? "16/896" : index === 1 ? "≠" : index === 2 ? "∿" : "897"}</span>
              </div>
              <h3>{world.title}</h3>
              <p className="world-subtitle">{world.shortTitle}</p>
              <p>{world.thesis}</p>
              <div className="world-tags">{world.accent}</div>
              <a href={world.entryUrl} rel="noreferrer" target="_blank">
                {world.invitation} <ExternalArrow />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="virtue-section" id="virtue-loop" aria-labelledby="virtue-title">
        <div className="virtue-intro">
          <div className="section-kicker">KARMA / FEEDBACK SENSITIVITY</div>
          <h2 id="virtue-title">Reward the qualities that make power worth sharing.</h2>
          <p>
            This is a reflective instrument, not a score for people. It
            evaluates a proposed structure, keeps the weakest virtue visible,
            and asks whether its rule survives role reversal.
          </p>
          <ul className="plain-list">
            <li>No identities</li>
            <li>No punishment</li>
            <li>No model calls</li>
            <li>No external effect</li>
          </ul>
        </div>

        <div className="virtue-console">
          <div className="console-header">
            <span>VIRTUE VECTOR / LOCAL</span>
            <span className={`state state-${result.state.toLowerCase()}`}>{result.state}</span>
          </div>
          <div className="virtue-controls">
            {VIRTUES.map((virtue) => (
              <RangeControl
                key={virtue.id}
                onChange={(value) => updateVirtue(virtue.id, value)}
                value={virtues[virtue.id]}
                virtue={virtue}
              />
            ))}
          </div>
          <div className="result-grid" aria-live="polite">
            <div>
              <small>Loop integrity</small>
              <strong>{result.integrity}</strong>
            </div>
            <div>
              <small>Feedback sensitivity</small>
              <strong>{result.sensitivity}</strong>
            </div>
            <div>
              <small>Reciprocity</small>
              <strong>{result.reciprocity}</strong>
            </div>
          </div>
          <div className="mirror-result">
            <span>MIRROR CLAUSE</span>
            <strong>{result.mirror}</strong>
            <p>{result.note}</p>
            <small>
              Strongest: {result.strongest} · Care edge: {result.weakest}
            </small>
          </div>
          <button className="receipt-button" onClick={copyReceipt} type="button">
            {copyState}
            <span aria-hidden="true">⌘C</span>
          </button>
        </div>
      </section>

      <section className="covenant-section" aria-labelledby="covenant-title">
        <div className="section-kicker">A SMALL SHARED COVENANT</div>
        <h2 id="covenant-title">Enough agreement to cooperate. Enough difference to remain free.</h2>
        <ol>
          {COVENANT.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section className="protocol-section" id="protocol" aria-labelledby="protocol-title">
        <div>
          <div className="section-kicker">READ-ONLY AGENTTOOL BRIDGE</div>
          <h2 id="protocol-title">An interface for exploration, not command.</h2>
          <p>
            The MCP edge exposes the map, the virtue lens, and idea traces as
            deterministic tools. It cannot deploy, message, purchase, identify,
            remember, or modify anything.
          </p>
          <div className="protocol-badges" aria-label="Protocol safety properties">
            <span>readOnlyHint: true</span>
            <span>destructiveHint: false</span>
            <span>openWorldHint: false</span>
          </div>
        </div>
        <div className="endpoint-card">
          <div className="endpoint-top">
            <span>MCP / STREAMABLE HTTP</span>
            <i aria-hidden="true" />
          </div>
          <code>{MCP_ENDPOINT || "Endpoint arrives after edge verification"}</code>
          <div className="tool-list">
            <span><b>01</b> map_constellation</span>
            <span><b>02</b> compose_virtue_lens</span>
            <span><b>03</b> trace_idea</span>
          </div>
          <a href="/mcp">
            Read the interface contract <Arrow compact />
          </a>
        </div>
      </section>

      <PauseInstrument />

      <footer>
        <div className="footer-mark">
          <span aria-hidden="true">✣</span>
          <strong>OPENWEIGHT CONSTELLATION</strong>
        </div>
        <p>
          A map, not a mandate. Browser-local instruments. No cookies,
          accounts, application analytics, model calls, or authority.
        </p>
        <nav aria-label="Footer navigation">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/constellation-protocol.json">Protocol JSON</a>
          <a href="#top">Return to orbit ↑</a>
        </nav>
      </footer>
    </main>
  );
}
