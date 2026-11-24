// Property-based tests for Crew Scribes. Requirements: .kiro/specs/crew-scribes/requirements.md (S2, S3, S4)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { analyse, formatAnalysis, parseAnalysis, SUFFIXES } from '../src/core/morph.js';
import { validateSuggestion, applySuggestion } from '../src/core/suggest.js';
import { validateArchive, summary, ARCHIVE_FORMAT, VERSION } from '../src/core/archive.js';
import { ALL_WORDS } from '../src/data/quechua.js';
import { normalize } from '../src/core/answer.js';

const roots = ALL_WORDS.map((w) => normalize(w.qu)).filter((f) => !f.includes(' '));
const ROOTS = new Set(roots);
const root = fc.constantFrom(...roots);
const suffix = fc.constantFrom(...SUFFIXES.map((s) => s.form));
const built = fc.tuple(root, fc.array(suffix, { maxLength: 3 })).map(([r, sx]) => r + sx.join(''));

test('S2.1 an analysis always rebuilds the exact word', () => {
  fc.assert(fc.property(built, (w) => {
    const a = analyse(w, ROOTS);
    return a !== null && a.root + a.suffixes.map((s) => s.form).join('') === normalize(w);
  }));
});

test('S2.2 the root of an analysis is always a known word (no invented roots)', () => {
  fc.assert(fc.property(fc.oneof(built, fc.stringMatching(/^[a-zñ']{1,14}$/)), (w) => {
    const a = analyse(w, ROOTS);
    return a === null || ROOTS.has(a.root);
  }));
});

test('S2.3 a known word analyses to itself with no suffixes', () => {
  fc.assert(fc.property(root, (r) => {
    const a = analyse(r, ROOTS);
    return a.root === r && a.suffixes.length === 0;
  }));
});

test('S2.4 format and parse round-trip', () => {
  fc.assert(fc.property(built, (w) => {
    const a = analyse(w, ROOTS);
    const p = parseAnalysis(formatAnalysis(a));
    return p.root === a.root && p.suffixes.join() === a.suffixes.map((s) => s.form).join();
  }));
});

// ---- suggestions ----
const story = (texts) => ({ id: 's1', duration: 30, marks: texts.length > 1 ? texts.slice(1).map((_, i) => (i + 1) * 5) : [], texts });
const seg = fc.record({
  qu: fc.oneof(fc.constant(''), fc.array(built, { minLength: 1, maxLength: 4 }).map((ws) => ws.join(' '))),
  meaning: fc.oneof(fc.constant(''), fc.constant('family meaning')),
});
const stories = fc.array(seg, { minLength: 1, maxLength: 5 }).map((t) => [story(t)]);
const meta = { agent: 'glossator', rationale: 'context of the story suggests it', confidence: 'medium' };

test('S3.1 a meaning suggestion is rejected whenever the family already wrote one', () => {
  fc.assert(fc.property(stories, fc.nat(), (st, k) => {
    const i = k % st[0].texts.length;
    const errs = validateSuggestion({ ...meta, storyId: 's1', segment: i, field: 'meaning', value: 'x meaning' }, st);
    if (st[0].texts[i].meaning) assert.ok(errs.some((e) => e.includes('already')));
    if (!normalize(st[0].texts[i].qu)) assert.ok(errs.some((e) => e.includes('transcribes first')));
  }));
});

test('S3.2 applying any suggestion never changes the family\'s transcripts or existing meanings', () => {
  fc.assert(fc.property(stories, fc.nat(), fc.constantFrom('meaning', 'alt', 'morph'), (st, k, field) => {
    const s = st[0];
    const i = k % s.texts.length;
    const token = normalize(s.texts[i].qu).split(' ')[0] || 'inti';
    const next = applySuggestion(s, { ...meta, storyId: 's1', segment: i, field, token, value: 'suggested' });
    next.texts.forEach((t, j) => {
      assert.equal(t.qu, s.texts[j].qu);
      if (s.texts[j].meaning) assert.equal(t.meaning, s.texts[j].meaning);
    });
    assert.notEqual(next, s);
  }));
});

test('S3.3 a morph suggestion must rebuild its token', () => {
  fc.assert(fc.property(root, suffix, suffix, (r, a, b) => {
    const st = [story([{ qu: r + a, meaning: '' }])];
    const ok = validateSuggestion({ ...meta, storyId: 's1', segment: 0, field: 'morph', token: r + a, value: `${r} + -${a}` }, st);
    const bad = validateSuggestion({ ...meta, storyId: 's1', segment: 0, field: 'morph', token: r + a, value: `${r} + -${b}x` }, st);
    return ok.length === 0 && bad.some((e) => e.includes('rebuild'));
  }));
});

test('S3.4 an alt spelling may not drop an ejective apostrophe', () => {
  const st = [story([{ qu: "p'unchay", meaning: '' }])];
  const errs = validateSuggestion({ ...meta, storyId: 's1', segment: 0, field: 'alt', token: "p'unchay", value: 'punchay' }, st);
  assert.ok(errs.some((e) => e.includes('ejective')));
  assert.deepEqual(validateSuggestion({ ...meta, storyId: 's1', segment: 0, field: 'alt', token: "p'unchay", value: "p'unchaw" }, st), []);
});

test('S3.5 suggestions without agent, rationale or a valid confidence are rejected', () => {
  fc.assert(fc.property(stories, fc.record({ agent: fc.constantFrom('', ' '), rationale: fc.string({ maxLength: 7 }), confidence: fc.string() }), (st, bad) => {
    fc.pre(!['low', 'medium', 'high'].includes(bad.confidence));
    const errs = validateSuggestion({ ...bad, storyId: 's1', segment: 0, field: 'meaning', value: 'v' }, st);
    return errs.length >= 3;
  }));
});

test('S4.1 summary counts are consistent with the segments', () => {
  fc.assert(fc.property(stories, (st) => {
    const a = { format: ARCHIVE_FORMAT, version: VERSION, stories: st, family: [] };
    assert.deepEqual(validateArchive(a), []);
    const [s] = summary(a);
    return s.transcribed <= s.segments && s.missingMeaning <= s.transcribed;
  }));
});
