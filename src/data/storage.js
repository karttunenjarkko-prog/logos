const STORAGE_KEY = 'logos.sessions.v1';
const SETTINGS_KEY = 'logos.settings.v1';

export function loadSessions() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { openAiApiKey: '' };
  } catch {
    return { openAiApiKey: '' };
  }
}

export function saveSettings(settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createSessionDraft(form, output) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    mode: form.mode,
    title: form.title.trim() || 'Nimeton sessio',
    body: form.body.trim(),
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    challengeLevel: form.challengeLevel,
    selectedSkill: form.selectedSkill ?? null,
    createdAt: now,
    updatedAt: now,
    output,
  };
}
