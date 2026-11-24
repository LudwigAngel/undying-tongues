// Persistence. Everything stays on the device: elders' voices never leave it
// unless the family exports them (see .kiro/steering/language-ethics.md).
//  - card progress -> localStorage (small JSON)
//  - voice recordings -> IndexedDB (Blobs)

const CARDS_KEY = 'undying-tongues:cards:v1';
const PREFS_KEY = 'undying-tongues:prefs:v1';
const DB_NAME = 'undying-tongues';
const STORE = 'voices';
const STORIES = 'stories';
const FAMILY_KEY = 'undying-tongues:family:v1';

/** Words the family harvested from stories: [{ id, qu, en, es, clip: { storyId, start, end } }] */
export function loadFamily() {
  try {
    return JSON.parse(localStorage.getItem(FAMILY_KEY)) ?? [];
  } catch {
    return [];
  }
}
export function saveFamily(words) {
  localStorage.setItem(FAMILY_KEY, JSON.stringify(words));
}

export function loadCards() {
  try {
    return JSON.parse(localStorage.getItem(CARDS_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function saveCards(cards) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function loadPrefs() {
  try {
    return { lang: 'en', ...JSON.parse(localStorage.getItem(PREFS_KEY)) };
  } catch {
    return { lang: 'en' };
  }
}

export function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

let dbPromise;
function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      for (const name of [STORE, STORIES]) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(mode, fn, name = STORE) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(name, mode);
    const req = fn(t.objectStore(name));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

/** voice = { blob, elder, recordedAt } */
export const saveVoice = (wordId, voice) => tx('readwrite', (s) => s.put(voice, wordId));
export const getVoice = (wordId) => tx('readonly', (s) => s.get(wordId));
export const deleteVoice = (wordId) => tx('readwrite', (s) => s.delete(wordId));
export const listVoiceIds = () => tx('readonly', (s) => s.getAllKeys());

/** story = { id, title, elder, blob, duration, recordedAt, marks: number[], texts: [{ qu, meaning }] } */
export const saveStory = (story) => tx('readwrite', (s) => s.put(story, story.id), STORIES);
export const getStory = (id) => tx('readonly', (s) => s.get(id), STORIES);
export const deleteStory = (id) => tx('readwrite', (s) => s.delete(id), STORIES);
export const listStories = () => tx('readonly', (s) => s.getAll(), STORIES);
