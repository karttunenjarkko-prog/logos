import React, { useState } from 'react';

export default function SettingsView({ settings, onSave }) {
  const [openAiApiKey, setOpenAiApiKey] = useState(settings.openAiApiKey ?? '');
  const [saved, setSaved] = useState(false);

  function saveSettings(event) {
    event.preventDefault();
    onSave({ openAiApiKey: openAiApiKey.trim() });
    setSaved(true);
  }

  return (
    <section className="view settings-view" aria-labelledby="settings-heading">
      <div className="view-header compact-header">
        <p className="eyebrow">Asetukset</p>
        <h1 id="settings-heading">Logos Brain</h1>
        <p className="lead">
          Lisää OpenAI API-avain, jotta Logos voi analysoida sessiot. Avain tallennetaan vain tähän selaimeen.
        </p>
      </div>

      <form className="settings-panel" onSubmit={saveSettings}>
        <label>
          <span>OpenAI API-avain</span>
          <input
            type="password"
            value={openAiApiKey}
            onChange={(event) => {
              setOpenAiApiKey(event.target.value);
              setSaved(false);
            }}
            placeholder="sk-..."
            autoComplete="off"
          />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={!openAiApiKey.trim()}>
            Tallenna avain
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setOpenAiApiKey('');
              onSave({ openAiApiKey: '' });
              setSaved(false);
            }}
          >
            Poista
          </button>
        </div>

        {saved && <p className="success-message">Avain tallennettu. Voit nyt testata sessiota.</p>}
        <p className="settings-note">
          Prototyyppihuomio: selaimeen tallennettu avain sopii paikalliseen testiin. Tuotannossa OpenAI-kutsu
          siirretään backendille tai edge functioniin.
        </p>
      </form>
    </section>
  );
}
