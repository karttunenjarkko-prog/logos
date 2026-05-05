import React, { useRef, useState } from 'react';

export default function CaptureView({ thoughts, onSaveThought, onSparThought }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const speechSupported =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  function saveTextThought(event) {
    event.preventDefault();
    const cleanText = text.trim();

    if (!cleanText) return;

    onSaveThought(cleanText, 'text');
    setText('');
    setError('');
    setStatus('Ajatus tallennettu.');
  }

  function startVoiceCapture() {
    if (!speechSupported) {
      setError('Äänisyöttö ei ole saatavilla tässä selaimessa.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fi-FI';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setError('');
      setStatus('Kuuntelen...');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript)
        .filter(Boolean)
        .join(' ')
        .trim();

      if (transcript) {
        onSaveThought(transcript, 'voice');
        setStatus('Ääniajatus tallennettu.');
      }
    };

    recognition.onerror = () => {
      setError('Äänisyöttö epäonnistui. Voit kirjoittaa ajatuksen tekstinä.');
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoiceCapture() {
    recognitionRef.current?.stop();
  }

  return (
    <section className="view capture-view" aria-labelledby="capture-heading">
      <div className="view-header compact-header">
        <p className="eyebrow">Capture</p>
        <h1 id="capture-heading">Kaappaa ajatus</h1>
        <p className="lead">Tallenna raaka ajatus heti. Ei otsikkoa, moodia, tageja tai tekoälyä.</p>
      </div>

      <form className="capture-panel" onSubmit={saveTextThought}>
        {status && <p className="success-message">{status}</p>}
        {error && <p className="error-message">{error}</p>}

        <label>
          <span>Raaka ajatus</span>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setStatus('');
            }}
            placeholder="Kirjoita ajatus juuri niin keskeneräisenä kuin se on..."
            rows="6"
          />
        </label>

        <div className="quick-actions">
          <button className="primary-button" type="submit" disabled={!text.trim()}>
            Tallenna heti
          </button>
          {speechSupported && (
            <button
              className="secondary-button"
              type="button"
              onClick={isListening ? stopVoiceCapture : startVoiceCapture}
            >
              {isListening ? 'Lopeta kuuntelu' : 'Puhu ajatus'}
            </button>
          )}
        </div>
      </form>

      <section className="captured-list" aria-labelledby="captured-heading">
        <h2 id="captured-heading">Tallennetut ajatukset</h2>
        {thoughts.length === 0 ? (
          <p className="muted">Ei raakamuistiinpanoja vielä.</p>
        ) : (
          <div className="thought-list">
            {thoughts.map((thought) => (
              <article className="thought-item" key={thought.id}>
                <div className="session-meta">
                  <span className="source-pill">{thought.source === 'voice' ? 'VOICE' : 'TEXT'}</span>
                  <time dateTime={thought.timestamp}>
                    {new Intl.DateTimeFormat('fi-FI', { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(thought.timestamp),
                    )}
                  </time>
                </div>
                <p>{thought.text}</p>
                <button className="secondary-button" type="button" onClick={() => onSparThought(thought)}>
                  Sparraa tästä
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
