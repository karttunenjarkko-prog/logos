import React from 'react';
import { CHALLENGE_LEVELS, EMPTY_SESSION, MODES } from '../constants.js';
import PlaceholderOutput from './PlaceholderOutput.jsx';

export default function SessionEditor({ form, onChange, onCancel, onSave, isThinking, engineError }) {
  const selectedMode = MODES.find((mode) => mode.id === form.mode) ?? MODES[0];
  const canSave = form.title.trim() || form.body.trim();

  function updateField(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <section className="view editor-view" aria-labelledby="editor-heading">
      <div className="view-header compact-header">
        <p className="eyebrow">{selectedMode.label}</p>
        <h1 id="editor-heading">Uusi sessio</h1>
        <p className="lead">{selectedMode.description}</p>
      </div>

      <form className="editor-layout" onSubmit={(event) => {
        event.preventDefault();
        if (canSave && !isThinking) onSave();
      }}>
        <div className="editor-main">
          {engineError && <p className="error-message">{engineError}</p>}

          <label>
            <span>Tila</span>
            <select value={form.mode} onChange={(event) => updateField('mode', event.target.value)}>
              {MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Otsikko</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Mitä haluat ajatella?"
            />
          </label>

          <label>
            <span>Vapaa teksti</span>
            <textarea
              value={form.body}
              onChange={(event) => updateField('body', event.target.value)}
              placeholder="Kirjoita tilanne, idea, havainto tai kysymys vapaasti."
              rows="10"
            />
          </label>

          <label>
            <span>Tagit</span>
            <input
              type="text"
              value={form.tags}
              onChange={(event) => updateField('tags', event.target.value)}
              placeholder="esim. työ, johtaminen, päätös"
            />
          </label>

          <fieldset>
            <legend>Haastetaso</legend>
            <div className="segmented-control">
              {CHALLENGE_LEVELS.map((level) => (
                <label key={level.id}>
                  <input
                    type="radio"
                    name="challengeLevel"
                    checked={form.challengeLevel === level.id}
                    onChange={() => updateField('challengeLevel', level.id)}
                  />
                  <span>{level.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => {
              onChange(EMPTY_SESSION);
              onCancel();
            }}>
              Peruuta
            </button>
            <button className="primary-button" type="submit" disabled={!canSave || isThinking}>
              {isThinking ? 'Logos ajattelee...' : 'Tallenna ja analysoi'}
            </button>
          </div>
        </div>

        <PlaceholderOutput title="Logos Brain" />
      </form>
    </section>
  );
}
