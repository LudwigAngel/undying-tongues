// Undying Archive tool runner. Called by server.py with one JSON request on stdin:
//   { "tool": "<name>", "args": { ... } }  ->  prints { "ok": true, "result": ... } or { "ok": false, "error": "..." }
// Least privilege: reads one family archive (*.undying.json), writes ONLY its sibling
// *.suggestions.json, and never returns audio.
import { readFileSync, writeFileSync, existsSync, statSync, renameSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateArchive, summary, segmentsView, knownRoots, SUGGESTIONS_FORMAT, VERSION } from './core/archive.js';
import { validateSuggestion } from './core/suggest.js';
import { analyse, formatAnalysis, SUFFIXES } from './core/morph.js';
import { normalize } from './core/answer.js';
import { ALL_WORDS } from './data/quechua.js';

const MAX_BYTES = 300 * 1024 * 1024;

function openArchive(path) {
  if (typeof path !== 'string' || !isAbsolute(path)) throw new Error('archive must be an absolute path');
  const p = resolve(path);
  if (!p.toLowerCase().endsWith('.undying.json')) throw new Error('archive must be a *.undying.json file exported from the app');
  if (!existsSync(p)) throw new Error(`archive not found: ${p}`);
  if (statSync(p).size > MAX_BYTES) throw new Error('archive is larger than 300 MB');
  const archive = JSON.parse(readFileSync(p, 'utf8'));
  const errors = validateArchive(archive);
  if (errors.length) throw new Error(`invalid archive: ${errors.join('; ')}`);
  return { p, archive };
}

const suggestionsPath = (p) => p.replace(/\.undying\.json$/i, '.suggestions.json');

function readSuggestions(p, archive) {
  const sp = suggestionsPath(p);
  if (!existsSync(sp)) return { format: SUGGESTIONS_FORMAT, version: VERSION, archiveExportedAt: archive.exportedAt ?? null, suggestions: [] };
  return JSON.parse(readFileSync(sp, 'utf8'));
}

const tools = {
  archive_summary({ archive }) {
    const { archive: a } = openArchive(archive);
    return { language: a.language ?? 'quz', exportedAt: a.exportedAt ?? null, familyWords: (a.family ?? []).length, stories: summary(a) };
  },

  list_segments({ archive, story_id }) {
    const { archive: a } = openArchive(archive);
    const view = segmentsView(a, story_id, ALL_WORDS);
    if (!view) throw new Error(`unknown story_id: ${story_id}`);
    return { story_id, segments: view.map((s) => ({ ...s, tokens: s.tokens.map((t) => ({ ...t, analysis: t.analysis && formatAnalysis(t.analysis) })) })) };
  },

  lookup_word({ archive, word }) {
    const { archive: a } = openArchive(archive);
    const roots = knownRoots(a, ALL_WORDS);
    const form = normalize(word);
    const entry = [...ALL_WORDS, ...(a.family ?? [])].find((w) => [w.qu, ...(w.alt ?? [])].map(normalize).includes(form));
    const an = analyse(form, roots);
    return {
      word: form,
      known: entry ? { qu: entry.qu, en: entry.en, es: entry.es } : null,
      analysis: an && { text: formatAnalysis(an), root: an.root, suffixes: an.suffixes },
      note: an ? 'root is a known family word' : 'no known root explains this word; any analysis you propose must be marked low confidence',
    };
  },

  suffix_table() {
    return { variety: 'Southern Quechua (Cusco-Collao)', suffixes: SUFFIXES };
  },

  propose({ archive, suggestion }) {
    const { p, archive: a } = openArchive(archive);
    const s = { ...suggestion };
    const errors = validateSuggestion(s, a.stories);
    if (errors.length) return { accepted: false, errors };
    const file = readSuggestions(p, a);
    const key = (x) => [x.storyId, x.segment, x.field, normalize(x.token ?? ''), normalize(x.value)].join('|');
    if (file.suggestions.some((x) => key(x) === key(s))) return { accepted: false, errors: ['duplicate suggestion'] };
    const saved = {
      id: randomUUID(), storyId: s.storyId, segment: s.segment, field: s.field, token: s.token ? normalize(s.token) : undefined,
      value: String(s.value).trim(), rationale: String(s.rationale).trim(), confidence: s.confidence, agent: String(s.agent).trim(),
      createdAt: new Date().toISOString(),
    };
    file.suggestions.push(saved);
    const sp = suggestionsPath(p);
    writeFileSync(`${sp}.tmp`, JSON.stringify(file, null, 2));
    renameSync(`${sp}.tmp`, sp);
    return { accepted: true, id: saved.id, file: sp, total: file.suggestions.length };
  },

  list_suggestions({ archive }) {
    const { p, archive: a } = openArchive(archive);
    const file = readSuggestions(p, a);
    return { file: suggestionsPath(p), count: file.suggestions.length, suggestions: file.suggestions };
  },
};

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let out;
  try {
    const { tool, args } = JSON.parse(input);
    if (!Object.hasOwn(tools, tool)) throw new Error(`unknown tool: ${tool}`);
    out = { ok: true, result: tools[tool](args ?? {}) };
  } catch (e) {
    out = { ok: false, error: e.message };
  }
  process.stdout.write(JSON.stringify(out));
});
