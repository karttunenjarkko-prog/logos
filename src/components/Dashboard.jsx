import React from 'react';
import { MODES } from '../constants.js';
import GuidedChat from './GuidedChat.jsx';

export default function Dashboard({
  sessions,
  chatMessages,
  chatInput,
  onChatInputChange,
  onChatSubmit,
  onQuickReply,
  isThinking,
  chatError,
  onStart,
  onOpenMemory,
  onOpenSkills,
}) {
  const latest = sessions.slice(0, 3);

  return (
    <section className="view dashboard-view" aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading" className="sr-only">Logos chat</h1>

      <GuidedChat
        messages={chatMessages}
        value={chatInput}
        onChange={onChatInputChange}
        onSend={onChatSubmit}
        onQuickReply={onQuickReply}
        isThinking={isThinking}
        error={chatError}
      />

      <section className="manual-modes" aria-labelledby="manual-modes-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Vaihtoehto</p>
            <h2 id="manual-modes-heading">Tai valitse käsittelytapa itse</h2>
          </div>
          <div className="dashboard-actions">
            <button className="secondary-button" type="button" onClick={onOpenSkills}>
              Taitokirjasto
            </button>
            <button className="secondary-button" type="button" onClick={onOpenMemory}>
              Muisti
            </button>
          </div>
        </div>

        <div className="mode-grid" aria-label="Valitse tila">
          {MODES.map((mode) => (
            <button key={mode.id} className="mode-card" type="button" onClick={() => onStart(mode.id)}>
              <span className="mode-label">{mode.label}</span>
              <strong>{mode.title}</strong>
              <span>{mode.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="recent-section" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Viimeisimmät</h2>
        {latest.length === 0 ? (
          <p className="muted">Ei tallennettuja sessioita vielä.</p>
        ) : (
          <div className="session-list compact">
            {latest.map((session) => (
              <article className="session-item" key={session.id}>
                <span className="mode-pill">{session.mode.toUpperCase()}</span>
                <h3>{session.title}</h3>
                <p>{session.body || 'Ei tekstisisältöä.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
