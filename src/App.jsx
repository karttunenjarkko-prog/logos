import React, { useEffect, useMemo, useState } from 'react';
import CaptureView from './components/CaptureView.jsx';
import Dashboard from './components/Dashboard.jsx';
import MemoryView from './components/MemoryView.jsx';
import SettingsView from './components/SettingsView.jsx';
import SessionEditor from './components/SessionEditor.jsx';
import SkillLibrary from './components/SkillLibrary.jsx';
import { EMPTY_SESSION } from './constants.js';
import {
  createSessionDraft,
  createThoughtDraft,
  loadSessions,
  loadSettings,
  loadThoughts,
  saveSessions,
  saveSettings,
  saveThoughts,
} from './data/storage.js';
import { logosChatTurn, logosEngine, prepareLogosSession } from './services/logosEngine.js';

const VIEWS = {
  dashboard: 'dashboard',
  capture: 'capture',
  editor: 'editor',
  skills: 'skills',
  memory: 'memory',
  settings: 'settings',
};

export default function App() {
  const [view, setView] = useState(VIEWS.dashboard);
  const [sessions, setSessions] = useState(() => loadSessions());
  const [thoughts, setThoughts] = useState(() => loadThoughts());
  const [settings, setSettings] = useState(() => loadSettings());
  const [form, setForm] = useState(EMPTY_SESSION);
  const [isThinking, setIsThinking] = useState(false);
  const [engineError, setEngineError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSession, setChatSession] = useState(null);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveThoughts(thoughts);
  }, [thoughts]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [sessions],
  );
  const sortedThoughts = useMemo(
    () => [...thoughts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [thoughts],
  );

  function startSession(mode) {
    setForm({ ...EMPTY_SESSION, mode });
    setEngineError('');
    setChatError('');
    setView(VIEWS.editor);
  }

  function startSkillSession(skill) {
    setForm({
      ...EMPTY_SESSION,
      mode: 'taito',
      title: skill.name,
      body: `${skill.summary}\n\nHarjoituskysymys: ${skill.prompts[0]}`,
      tags: 'taito',
      selectedSkill: skill,
    });
    setEngineError('');
    setChatError('');
    setView(VIEWS.editor);
  }

  async function sendChatTurn(input, options = {}) {
    const cleanInput = input.trim();
    if (!cleanInput || isThinking) return;

    const quickIntent = typeof options === 'string' ? options : options.quickIntent ?? null;
    const resetThread = typeof options === 'object' && options.resetThread;
    const forcedIntake = typeof options === 'object' ? options.forcedIntake : null;
    const baseMessages = resetThread ? [] : chatMessages;
    const activeChatSession = resetThread ? null : chatSession;

    setIsThinking(true);
    setChatError('');
    setChatInput('');
    if (resetThread) {
      setChatMessages([]);
      setChatSession(null);
    }

    try {
      const userMessage = createUserMessage(cleanInput);
      const nextTranscript = [...baseMessages, userMessage];
      setChatMessages(nextTranscript);

      const intake =
        forcedIntake ??
        activeChatSession ??
        (await prepareLogosSession(cleanInput, {
          apiKey: settings.openAiApiKey,
          pastSessions: sortedSessions,
        }));

      const response = await logosChatTurn(cleanInput, {
        apiKey: settings.openAiApiKey,
        mode: intake.mode,
        title: intake.title,
        pastSessions: sortedSessions,
        transcript: nextTranscript,
        quickIntent,
      });

      const assistantMessage = createAssistantMessage(response, intake);
      const finalTranscript = [...nextTranscript, assistantMessage];
      const output = chatOutputToSessionOutput(response);

      if (activeChatSession?.id && !forcedIntake) {
        setSessions((current) =>
          current.map((session) =>
            session.id === activeChatSession.id
              ? {
                  ...session,
                  output,
                  transcript: finalTranscript,
                  updatedAt: new Date().toISOString(),
                }
              : session,
          ),
        );
        setChatMessages(finalTranscript);
      } else {
        const chatForm = {
          ...EMPTY_SESSION,
          mode: intake.mode,
          title: intake.title,
          body: cleanInput,
          tags: intake.tags.join(', '),
        };
        const nextSession = {
          ...createSessionDraft(chatForm, output),
          transcript: finalTranscript,
        };
        setSessions((current) => [nextSession, ...current]);
        setChatSession({
          id: nextSession.id,
          mode: nextSession.mode,
          title: nextSession.title,
          tags: nextSession.tags,
        });
        setChatMessages(finalTranscript);
      }
      setView(VIEWS.dashboard);
    } catch (error) {
      setChatMessages(baseMessages);
      setChatInput(cleanInput);
      setChatError(error.message || 'Logos Brain ei saanut vastausta.');
    } finally {
      setIsThinking(false);
    }
  }

  function sendQuickReply(action) {
    const prompts = {
      deepen: 'Syvennä tätä.',
      challenge: 'Haasta tätä rakentavasti.',
      action: 'Muuta tämä käytäntöön.',
    };

    sendChatTurn(prompts[action] ?? 'Jatketaan tästä.', { quickIntent: action });
  }

  function saveRawThought(text, source) {
    const thought = createThoughtDraft(text, source);
    setThoughts((current) => [thought, ...current]);
  }

  function sparRawThought(thought) {
    sendChatTurn(thought.text, {
      resetThread: true,
      forcedIntake: {
        mode: 'sparri',
        title: createThoughtTitle(thought.text),
        tags: ['capture', thought.source],
      },
    });
  }

  async function saveCurrentSession() {
    setIsThinking(true);
    setEngineError('');

    try {
      const output = await logosEngine(form.mode, buildEngineInput(form), {
        apiKey: settings.openAiApiKey,
        challengeLevel: form.challengeLevel,
        pastSessions: sortedSessions,
        selectedSkill: form.selectedSkill,
      });
      const nextSession = createSessionDraft(form, output);
      setSessions((current) => [nextSession, ...current]);
      setForm(EMPTY_SESSION);
      setView(VIEWS.memory);
    } catch (error) {
      setEngineError(error.message || 'Logos Brain ei saanut vastausta.');
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => setView(VIEWS.dashboard)}>
          Logos
        </button>
        <nav aria-label="Päänavigaatio">
          <button type="button" className={view === VIEWS.dashboard ? 'active' : ''} onClick={() => setView(VIEWS.dashboard)}>
            Työpöytä
          </button>
          <button type="button" className={view === VIEWS.capture ? 'active' : ''} onClick={() => setView(VIEWS.capture)}>
            Kaappaa
          </button>
          <button type="button" className={view === VIEWS.skills ? 'active' : ''} onClick={() => setView(VIEWS.skills)}>
            Taidot
          </button>
          <button type="button" className={view === VIEWS.memory ? 'active' : ''} onClick={() => setView(VIEWS.memory)}>
            Muisti
          </button>
          <button type="button" className={view === VIEWS.settings ? 'active' : ''} onClick={() => setView(VIEWS.settings)}>
            Asetukset
          </button>
        </nav>
      </header>

      <main>
        {view === VIEWS.dashboard && (
          <Dashboard
            sessions={sortedSessions}
            chatMessages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onChatSubmit={sendChatTurn}
            onQuickReply={sendQuickReply}
            isThinking={isThinking}
            chatError={chatError}
            onStart={startSession}
            onOpenMemory={() => setView(VIEWS.memory)}
            onOpenSkills={() => setView(VIEWS.skills)}
          />
        )}
        {view === VIEWS.capture && (
          <CaptureView thoughts={sortedThoughts} onSaveThought={saveRawThought} onSparThought={sparRawThought} />
        )}
        {view === VIEWS.editor && (
          <SessionEditor
            form={form}
            onChange={setForm}
            onCancel={() => setView(VIEWS.dashboard)}
            onSave={saveCurrentSession}
            isThinking={isThinking}
            engineError={engineError}
          />
        )}
        {view === VIEWS.skills && <SkillLibrary onStartSkill={startSkillSession} />}
        {view === VIEWS.memory && <MemoryView sessions={sortedSessions} />}
        {view === VIEWS.settings && <SettingsView settings={settings} onSave={setSettings} />}
      </main>
    </div>
  );
}

function buildEngineInput(form) {
  return {
    title: form.title,
    text: form.body,
    tags: form.tags,
    challenge_level: form.challengeLevel,
  };
}

function createUserMessage(content) {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
  };
}

function createAssistantMessage(response, intake) {
  if (response.type === 'sparri_challenge') {
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      mode: intake.mode,
      title: intake.title,
      sparriChallenge: response,
    };
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    mode: intake.mode,
    title: intake.title,
    observation: response.observation,
    question: response.question,
    structured: response.structured,
  };
}

function chatOutputToSessionOutput(response) {
  if (response.type === 'sparri_challenge') {
    return response;
  }

  const keyPoints = [
    response.structured?.insight,
    response.structured?.challenge,
    response.structured?.action,
  ].filter(Boolean);

  return {
    summary: response.structured?.summary || response.observation,
    key_points: keyPoints.length > 0 ? keyPoints.slice(0, 4) : [response.question],
    challenge_question: response.question,
    next_action: response.structured?.action || 'Vastaa Logoksen kysymykseen ja jatka siitä.',
  };
}

function createThoughtTitle(text) {
  const normalized = text.trim().replace(/\s+/g, ' ');
  const words = normalized.split(' ').slice(0, 5).join(' ');
  return words || 'Raaka ajatus';
}
