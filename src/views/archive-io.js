// Family archive export/import and Crew Scribes suggestions inbox (.kiro/specs/crew-scribes).
import { ARCHIVE_FORMAT, SUGGESTIONS_FORMAT, VERSION, validateArchive } from '../core/archive.js';
import { validateSuggestion } from '../core/suggest.js';
import * as store from '../storage.js';

const INBOX_KEY = 'undying-tongues:suggestions:v1';

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});

function base64ToBlob(b64, mime) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || 'audio/webm' });
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportArchive() {
  const stories = await store.listStories();
  const out = {
    format: ARCHIVE_FORMAT, version: VERSION, exportedAt: new Date().toISOString(), language: 'quz',
    family: store.loadFamily(),
    stories: await Promise.all(stories.map(async ({ blob, ...s }) => ({
      ...s, audio: { mime: blob.type, base64: await blobToBase64(blob) },
    }))),
  };
  const day = out.exportedAt.slice(0, 10);
  download(`family-${day}.undying.json`, JSON.stringify(out));
  return out.stories.length;
}

export function loadInbox() {
  try { return JSON.parse(localStorage.getItem(INBOX_KEY)) ?? []; } catch { return []; }
}
export function saveInbox(list) {
  localStorage.setItem(INBOX_KEY, JSON.stringify(list));
}

/** Import either an archive (stories + family words) or a scribes suggestions file. */
export async function importFile(file) {
  const data = JSON.parse(await file.text());
  if (data?.format === ARCHIVE_FORMAT) {
    const errors = validateArchive(data);
    if (errors.length) throw new Error(errors.join('; '));
    for (const { audio, ...s } of data.stories) {
      await store.saveStory({ ...s, blob: base64ToBlob(audio?.base64 ?? '', audio?.mime) });
    }
    const family = store.loadFamily();
    const ids = new Set(family.map((w) => w.id));
    store.saveFamily([...family, ...(data.family ?? []).filter((w) => !ids.has(w.id))]);
    return { kind: 'archive', count: data.stories.length };
  }
  if (data?.format === SUGGESTIONS_FORMAT) {
    // Re-validate on the device: the file may have been edited by hand after the scribes ran.
    const stories = await store.listStories();
    const inbox = loadInbox();
    const seen = new Set(inbox.map((s) => s.id));
    let added = 0;
    let invalid = 0;
    for (const s of data.suggestions ?? []) {
      if (seen.has(s.id)) continue;
      if (validateSuggestion(s, stories).length) { invalid += 1; continue; }
      inbox.push({ ...s, status: 'pending' });
      added += 1;
    }
    saveInbox(inbox);
    return { kind: 'suggestions', count: added, invalid };
  }
  throw new Error('not an Undying Tongues file');
}
