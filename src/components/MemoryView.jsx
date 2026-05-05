import React, { useMemo, useState } from 'react';
import { MODES } from '../constants.js';
import PlaceholderOutput from './PlaceholderOutput.jsx';

export default function MemoryView({ sessions }) {
  const [modeFilter, setModeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');

  const allTags = useMemo(() => {
    const tags = new Set();
    sessions.forEach((session) => session.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [sessions]);

  const filteredSessions = sessions.filter((session) => {
    const matchesMode = modeFilter === 'all' || session.mode === modeFilter;
    const normalizedTag = tagFilter.trim().toLowerCase();
    const matchesTag = !normalizedTag || session.tags.includes(normalizedTag);
    return matchesMode && matchesTag;
  });

  return (
    <section className="view memory-view" aria-labelledby="memory-heading">
      <div className="view-header compact-header">
        <p className="eyebrow">Muisti</p>
        <h1 id="memory-heading">Tallennetut ajatukset</h1>
        <p className="lead">Selaa ideoita ja sessioita tilan tai tagin mukaan.</p>
      </div>

      <div className="filters" aria-label="Suodattimet">
        <label>
          <span>Tila</span>
          <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
            <option value="all">Kaikki</option>
            {MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Tagi</span>
          <input
            list="known-tags"
            type="text"
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            placeholder="Suodata tagilla"
          />
          <datalist id="known-tags">
            {allTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </label>
      </div>

      {filteredSessions.length === 0 ? (
        <p className="empty-state">Ei osumia valituilla suodattimilla.</p>
      ) : (
        <div className="session-list">
          {filteredSessions.map((session) => (
            <article className="session-detail" key={session.id}>
              <div className="session-meta">
                <span className="mode-pill">{session.mode.toUpperCase()}</span>
                <time dateTime={session.createdAt}>
                  {new Intl.DateTimeFormat('fi-FI', { dateStyle: 'medium', timeStyle: 'short' }).format(
                    new Date(session.createdAt),
                  )}
                </time>
              </div>
              <h2>{session.title}</h2>
              <p>{session.body || 'Ei tekstisisältöä.'}</p>
              {session.tags.length > 0 && (
                <div className="tag-row">
                  {session.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
              <PlaceholderOutput output={session.output} title="Logos Brain" />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
