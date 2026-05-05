import React from 'react';
import { FREEFORM_EXAMPLES, STARTER_PROMPTS } from '../constants.js';

export default function GuidedChat({
  messages,
  value,
  onChange,
  onSend,
  onQuickReply,
  isThinking,
  error,
}) {
  const hasMessages = messages.length > 0;

  function submit(event) {
    event.preventDefault();
    onSend(value);
  }

  function showStarterPrompt() {
    const nextPrompt = STARTER_PROMPTS[Math.floor(Math.random() * STARTER_PROMPTS.length)];
    onChange(nextPrompt);
  }

  return (
    <section className="chat-panel" aria-label="Logos chat">
      {!hasMessages && (
        <div className="chat-empty-state">
          <p className="eyebrow">Logos</p>
          <h1>Mitä mietit juuri nyt?</h1>
          <p className="lead">
            Kirjoita keskeneräisesti. Logos vastaa havainnolla ja yhdellä kysymyksellä.
          </p>
        </div>
      )}

      {hasMessages && (
        <div className="chat-thread" aria-live="polite">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      <form className="chat-composer" onSubmit={submit}>
        <label>
          <span>{hasMessages ? 'Jatka ajatusta' : 'Aloita yhdellä ajatuksella'}</span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Kirjoita yksi sotkuinen ajatus, tilanne tai havainto..."
            rows={hasMessages ? 4 : 7}
          />
        </label>

        {!hasMessages && (
          <div className="example-row" aria-label="Esimerkkialoituksia">
            {FREEFORM_EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => onChange(example)}>
                {example}
              </button>
            ))}
          </div>
        )}

        <div className="quick-actions">
          <button className="primary-button" type="submit" disabled={!value.trim() || isThinking}>
            {isThinking ? 'Logos ajattelee...' : hasMessages ? 'Lähetä' : 'Jatka Logoksen kanssa'}
          </button>
          {!hasMessages && (
            <button className="secondary-button" type="button" onClick={showStarterPrompt}>
              Anna minulle aloituskysymys
            </button>
          )}
        </div>
      </form>

      {hasMessages && (
        <div className="quick-replies" aria-label="Pikavastaukset">
          <button type="button" onClick={() => onQuickReply('deepen')} disabled={isThinking}>
            Syvennä tätä
          </button>
          <button type="button" onClick={() => onQuickReply('challenge')} disabled={isThinking}>
            Haasta tätä
          </button>
          <button type="button" onClick={() => onQuickReply('action')} disabled={isThinking}>
            Muuta käytäntöön
          </button>
        </div>
      )}
    </section>
  );
}

function ChatMessage({ message }) {
  if (message.role === 'user') {
    return (
      <article className="chat-message user-message">
        <p>{message.content}</p>
      </article>
    );
  }

  return (
    <article className="chat-message logos-message">
      <div className="chat-message-meta">
        {message.mode && <span className="mode-pill">{message.mode.toUpperCase()}</span>}
        {message.title && <strong>{message.title}</strong>}
      </div>
      {message.sparriChallenge ? (
        <SparriChallengeBlock challenge={message.sparriChallenge} />
      ) : (
        <>
          <p>{message.observation}</p>
          <p className="chat-question">{message.question}</p>
          <StructuredBlock structured={message.structured} />
        </>
      )}
    </article>
  );
}

function StructuredBlock({ structured }) {
  if (!structured) return null;

  const items = [
    ['Yhteenveto', structured.summary],
    ['Oivallus', structured.insight],
    ['Haaste', structured.challenge],
    ['Teko', structured.action],
  ].filter(([, value]) => value);

  if (items.length === 0) return null;

  return (
    <div className="chat-structured-block">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <p>{value}</p>
        </div>
      ))}
    </div>
  );
}

function SparriChallengeBlock({ challenge }) {
  return (
    <div className="sparri-challenge-block">
      <div>
        <span>Tunnistettu oletus</span>
        <p>{challenge.detected_assumption}</p>
      </div>
      <div>
        <span>Miksi sillä on väliä</span>
        <p>{challenge.why_it_matters}</p>
      </div>
      <div>
        <span>Logoksen kysymys</span>
        <p className="chat-question">{challenge.challenge_question}</p>
      </div>
    </div>
  );
}
