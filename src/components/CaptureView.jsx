import React, { useEffect, useRef, useState } from 'react';
import {
  commitSessionResults,
  composeRecognitionTranscript,
  hasStopCommand,
  removeStopCommand,
  updateRecognitionResults,
} from '../services/speechTranscript.js';

const STOP_FALLBACK_MS = 1500;

export default function CaptureView({ thoughts, onSaveThought, onSparThought }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);
  const committedTranscriptRef = useRef('');
  const recognitionResultsRef = useRef([]);
  const currentTranscriptRef = useRef('');
  const keepListeningRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const voiceSavedRef = useRef(false);
  const restartTimerRef = useRef(null);
  const stopFallbackTimerRef = useRef(null);
  const captureGenerationRef = useRef(0);
  const speechSupported =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(
    () => () => {
      captureGenerationRef.current += 1;
      keepListeningRef.current = false;
      pendingSaveRef.current = false;
      window.clearTimeout(restartTimerRef.current);
      window.clearTimeout(stopFallbackTimerRef.current);
      const activeRecognition = recognitionRef.current;
      recognitionRef.current = null;
      activeRecognition?.abort();
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
    pendingSaveRef.current = false;
    window.clearTimeout(restartTimerRef.current);
    window.clearTimeout(stopFallbackTimerRef.current);
    const cleanTranscript = removeStopCommand(rawTranscript);

    if (cleanTranscript) {
      onSaveThought(cleanTranscript, 'voice');
      setStatus('Ajatus tallennettu.');
    } else {
      setStatus('Kuuntelu lopetettu. Mitään ei tallennettu.');
    }

    setIsListening(false);
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    activeRecognition?.abort();
  }

  function refreshVisibleTranscript() {
    const transcript = composeRecognitionTranscript(
      committedTranscriptRef.current,
      recognitionResultsRef.current,
    );
    currentTranscriptRef.current = transcript.combinedTranscript;
    setLiveTranscript(transcript.combinedTranscript);
    return transcript;
  }

  function commitRecognitionSession() {
    committedTranscriptRef.current = commitSessionResults(
      committedTranscriptRef.current,
      recognitionResultsRef.current,
    );
    recognitionResultsRef.current = [];
    currentTranscriptRef.current = committedTranscriptRef.current;
    setLiveTranscript(committedTranscriptRef.current);
  }

  function requestStopAndSave() {
    if (voiceSavedRef.current || pendingSaveRef.current) return;

    keepListeningRef.current = false;
    pendingSaveRef.current = true;
    window.clearTimeout(restartTimerRef.current);
    setStatus('Viimeistelen tallennusta...');

    const activeRecognition = recognitionRef.current;
    if (!activeRecognition) {
      saveVoiceThought(currentTranscriptRef.current);
      return;
    }

    try {
      stopFallbackTimerRef.current = window.setTimeout(() => {
        saveVoiceThought(currentTranscriptRef.current);
      }, STOP_FALLBACK_MS);
      activeRecognition.stop();
    } catch {
      saveVoiceThought(currentTranscriptRef.current);
    }
  }

  function createRecognition(generation) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fi-FI';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (captureGenerationRef.current !== generation || recognitionRef.current !== recognition) return;
      setError('');
      setStatus('Kuuntelen...');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      if (captureGenerationRef.current !== generation || recognitionRef.current !== recognition) return;

      recognitionResultsRef.current = updateRecognitionResults(recognitionResultsRef.current, event);
      const transcript = refreshVisibleTranscript();
      logRecognitionEvent(event, recognitionResultsRef.current, transcript, generation);

      if (hasStopCommand(transcript.combinedTranscript)) {
        requestStopAndSave();
      }
    };

    recognition.onerror = (event) => {
      if (captureGenerationRef.current !== generation || recognitionRef.current !== recognition) return;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        keepListeningRef.current = false;
        pendingSaveRef.current = false;
        setIsListening(false);
        setError('Salli mikrofonin käyttö selaimen asetuksista.');
        return;
      }

      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('Kuuntelu katkesi. Yritän jatkaa automaattisesti.');
      }
    };

    recognition.onend = () => {
      if (captureGenerationRef.current !== generation || recognitionRef.current !== recognition) return;

      recognitionRef.current = null;
      window.clearTimeout(stopFallbackTimerRef.current);

      const transcript = refreshVisibleTranscript();
      if (pendingSaveRef.current) {
        saveVoiceThought(transcript.combinedTranscript);
        return;
      }

      commitRecognitionSession();

      if (keepListeningRef.current && !voiceSavedRef.current) {
        restartTimerRef.current = window.setTimeout(() => startRecognition(generation), 250);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }

  function startRecognition(generation) {
    if (
      captureGenerationRef.current !== generation ||
      !keepListeningRef.current ||
      recognitionRef.current
    ) {
      return;
    }

    try {
      recognitionResultsRef.current = [];
      const recognition = createRecognition(generation);
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

    captureGenerationRef.current += 1;
    const generation = captureGenerationRef.current;
    window.clearTimeout(restartTimerRef.current);
    window.clearTimeout(stopFallbackTimerRef.current);
    const staleRecognition = recognitionRef.current;
    recognitionRef.current = null;
    staleRecognition?.abort();
    committedTranscriptRef.current = '';
    recognitionResultsRef.current = [];
    currentTranscriptRef.current = '';
    keepListeningRef.current = true;
    pendingSaveRef.current = false;
    voiceSavedRef.current = false;
    setLiveTranscript('');
    setIsListening(true);
    setStatus('');
    setError('');
    startRecognition(generation);
  }

  function stopVoiceCapture() {
    requestStopAndSave();
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

function logRecognitionEvent(event, recognitionResults, transcript, generation) {
  const results = Array.from({ length: event.results.length }, (_, index) => ({
    index,
    transcript: event.results[index][0]?.transcript ?? '',
    isFinal: Boolean(event.results[index].isFinal),
  }));
  const sessionTranscript = composeRecognitionTranscript('', recognitionResults).combinedTranscript;

  console.log('[Logos voice] onresult', {
    generation,
    resultIndex: event.resultIndex,
    resultsLength: event.results.length,
    results,
    sessionTranscript,
    currentTranscript: transcript.combinedTranscript,
  });
}
