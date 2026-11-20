// Progress store: the earned set lives in localStorage, and can be exported
// to a file and imported back. Nothing leaves the browser unless the reader
// chooses Export. A demo set (13 trophies, an early-game save) seeds the
// screenshots and lets a reader try the tracker at a glance.

export const STORAGE_KEY = 'leonida-platinum-progress-v1';
export const SETTINGS_KEY = 'leonida-platinum-settings-v1';

// An early-game save: the opening story trophies, a few activities and the
// first money trophies, 13 of 55 earned.
export const DEMO_EARNED = [2, 3, 8, 15, 16, 20, 21, 32, 35, 42, 52, 53, 55];

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.earned)) return new Set();
    return new Set(parsed.earned.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  const payload = { version: 1, earned: [...earned].sort((a, b) => a - b), savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, ...settings }));
}

export function exportProgress(earned, settings) {
  const payload = {
    version: 1,
    app: 'leonida-platinum',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload.earned.length;
}

export function parseImportedProgress(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a progress file.');
  const earned = parsed.earned;
  if (!Array.isArray(earned)) throw new Error('No earned list in the file.');
  const ids = earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
  return { earned: new Set(ids), settings: parsed.settings || {} };
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
