import React, { useEffect, useRef, useState } from 'react';

const STOP_COMMAND = /(?:^|\s)(?:tallenna|lopeta|siin[aä] kaikki)[.!?]?\s*$/i;

function normalizeSpeech(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export default function CaptureView({ thoughts, onSaveThought, onSparThought }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const currentTranscriptRef = useRef('');
  const keepListeningRef = useRef(false);
  const voiceSavedRef = useRef(false);
  const restartTimerRef = useRef(null);
  const speechSupported =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(
    () => () => {
      keepListeningRef.current = false;
      window.clearTimeout(restartTimerRef.current);
      recognitionRef.current?.abort();
    },
    [],
  );

  function saveTextThought(event) {
    event.preventDefault();
    const cleanText = text.trim();

    if (!cleanText) return;

    onSaveThought(cleanText, 'text');
    setText('');
    setError('');
    setStatus('Ajatus tallennettu.');
  }

  function saveVoiceThought(rawTranscript) {
    if (voiceSavedRef.current) return;

    voiceSavedRef.current = true;
    keepListeningRef.current = false;
    const cleanTranscript = normalizeSpeech(rawTranscript).replace(STOP_COMMAND, '').trim();

    if (cleanTranscript) {
      onSaveThought(cleanTranscript, 'voice');
      setStatus('Ajatus tallennettu.');
    } else {
      setStatus('Kuuntelu lopetettu. Mitään ei tallennettu.');
    }

    setIsListening(false);
    recognitionRef.current?.stop();
  }

  function createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fi-FI';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setError('');
      setStatus('Kuuntelen...');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = finalTranscriptRef.current;
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? '';
        if (event.results[index].isFinal) {
          finalTranscript = normalizeSpeech(`${finalTranscript} ${transcript}`);
        } else {
          interimTranscript += ` ${transcript}`;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      const combinedTranscript = normalizeSpeech(`${finalTranscript} ${interimTranscript}`);
      currentTranscriptRef.current = combinedTranscript;
      setLiveTranscript(combinedTranscript);

      if (STOP_COMMAND.test(combinedTranscript)) {
        saveVoiceThought(combinedTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        keepListeningRef.current = false;
        setIsListening(false);
        setError('Salli mikrofonin käyttö selaimen asetuksista.');
        return;
      }

      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('Kuuntelu katkesi. Yritän jatkaa automaattisesti.');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (keepListeningRef.current && !voiceSavedRef.current) {
        restartTimerRef.current = window.setTimeout(startRecognition, 250);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }

  function startRecognition() {
    if (!keepListeningRef.current || recognitionRef.current) return;

    try {
      const recognition = createRecognition();
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      keepListeningRef.current = false;
      setIsListening(false);
      setError('Kuuntelua ei voitu käynnistää. Yritä uudelleen.');
    }
  }

  function startVoiceCapture() {
    if (!speechSupported) {
      setError('Äänisyöttö ei ole saatavilla tässä selaimessa.');
      return;
    }

    window.clearTimeout(restartTimerRef.current);
    finalTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    keepListeningRef.current = true;
    voiceSavedRef.current = false;
    setLiveTranscript('');
    setStatus('');
    setError('');
    startRecognition();
  }

  function stopVoiceCapture() {
    saveVoiceThought(currentTranscriptRef.current);
  }

  return (
    <section className="view capture-view" aria-labelledby="capture-heading">
      <div className="view-header compact-header">
        <p className="eyebrow">Nopea tallennus</p>
        <h1 id="capture-heading">Mitä mielessä?</h1>
      </div>

      <form className="capture-panel" onSubmit={saveTextThought}>
        {status && <p className="success-message">{status}</p>}
        {error && <p className="error-message">{error}</p>}

        {speechSupported ? (
          <div className={`voice-capture ${isListening ? 'is-listening' : ''}`}>
            <button
              className="voice-capture-button"
              type="button"
              onClick={isListening ? stopVoiceCapture : startVoiceCapture}
            >
              {isListening ? 'Lopeta ja tallenna' : 'Puhu ajatus'}
            </button>
            <p className="voice-status" aria-live="polite">
              {isListening ? 'Kuuntelen. Voit myös sanoa “tallenna” tai “lopeta”.' : 'Yksi painallus riittää.'}
            </p>
            {isListening && (
              <div className="live-transcript" aria-live="polite">
                {liveTranscript || '…'}
              </div>
            )}
          </div>
        ) : (
          <p className="muted">Puhe ei ole käytettävissä tässä selaimessa. Voit tallentaa ajatuksen tekstinä.</p>
        )}

        <label className="text-capture">
          <span>Tai kirjoita</span>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setStatus('');
            }}
            placeholder="Kirjoita keskeneräinenkin ajatus…"
            rows="4"
          />
        </label>

        <div className="text-capture-actions">
          <button className="primary-button" type="submit" disabled={!text.trim()}>
            Tallenna
          </button>
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
