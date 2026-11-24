// Property-based tests for Story Harvest. Requirements: .kiro/specs/story-harvest/requirements.md (H2, H3)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { addMark, removeMark, segmentsFrom, tokenize, propose } from '../src/core/harvest.js';
import { normalize } from '../src/core/answer.js';

const duration = fc.double({ min: 1, max: 1800, noNaN: true });
const taps = fc.array(fc.double({ min: -10, max: 2000, noNaN: true }), { maxLength: 60 });
const build = (ts, d) => ts.reduce((m, t) => addMark(m, t, d), []);

test('H2.1 marks stay sorted, inside (0, duration) and at least 0.25 s apart', () => {
  fc.assert(fc.property(taps, duration, (ts, d) => {
    const m = build(ts, d);
    return m.every((x, i) => x > 0 && x < d && (i === 0 || x - m[i - 1] >= 0.25 - 1e-9));
  }));
});

test('H2.2 segments cover the whole story exactly, in order, without gaps or overlaps', () => {
  fc.assert(fc.property(taps, duration, (ts, d) => {
    const m = build(ts, d);
    const s = segmentsFrom(m, d);
    assert.equal(s.length, m.length + 1);
    assert.equal(s[0].start, 0);
    assert.equal(s.at(-1).end, d);
    s.forEach((seg, i) => {
      assert.ok(seg.end > seg.start);
      assert.equal(seg.index, i);
      if (i) assert.equal(seg.start, s[i - 1].end);
    });
  }));
});

test('H2.3 removing a mark merges two neighbours and keeps the coverage', () => {
  fc.assert(fc.property(taps, duration, fc.nat(), (ts, d, k) => {
    const m = build(ts, d);
    fc.pre(m.length > 0);
    const m2 = removeMark(m, k % m.length);
    const s = segmentsFrom(m2, d);
    return s.length === m.length && s[0].start === 0 && s.at(-1).end === d;
  }));
});

test('H2.4 adding marks never mutates the previous list', () => {
  fc.assert(fc.property(taps, duration, fc.double({ min: 0, max: 2000, noNaN: true }), (ts, d, t) => {
    const m = build(ts, d);
    const copy = [...m];
    addMark(m, t, d);
    return JSON.stringify(m) === JSON.stringify(copy);
  }));
});

const quWord = fc.constantFrom('inti', 'killa', "p'unchay", 'wasi', 'mayu', "t'anta", 'urqu', 'yaku', 'kay', 'chay');
const sentence = fc.array(quWord, { minLength: 1, maxLength: 8 }).map((ws) => ws.join(' '));
const texts = fc.array(fc.record({ qu: fc.oneof(sentence, fc.constant('')), meaning: fc.oneof(fc.constant(''), fc.constant('a meaning')) }), { maxLength: 12 });

test('H3.1 tokens keep the ejective apostrophe and never are empty', () => {
  fc.assert(fc.property(sentence, (s) => {
    const toks = tokenize(`¡${s.toUpperCase()}!`);
    return toks.length > 0 && toks.every((t) => t.length > 0) && (!s.includes("'") || toks.some((t) => t.includes("'")));
  }));
});

test('H3.2 proposed words are distinct, unknown, and point at a segment where they are heard', () => {
  fc.assert(fc.property(texts, fc.subarray(['inti', 'wasi', 'kay']), (tx, known) => {
    const segs = tx.map((_, i) => ({ index: i, start: i, end: i + 1 }));
    const { words } = propose(segs, tx, known);
    const forms = words.map((w) => w.form);
    assert.equal(new Set(forms).size, forms.length);
    for (const w of words) {
      assert.ok(!known.includes(w.form));
      assert.ok(tokenize(tx[w.segment].qu).includes(w.form));
    }
  }));
});

test('H3.3 word counts add up to the number of unknown tokens, sorted by count', () => {
  fc.assert(fc.property(texts, (tx) => {
    const segs = tx.map((_, i) => ({ index: i, start: i, end: i + 1 }));
    const { words } = propose(segs, tx, []);
    const total = tx.flatMap((t) => tokenize(t.qu)).length;
    assert.equal(words.reduce((a, w) => a + w.count, 0), total);
    for (let i = 1; i < words.length; i++) assert.ok(words[i - 1].count >= words[i].count);
  }));
});

test('H3.4 only segments with both a transcript and a meaning become phrase cards', () => {
  fc.assert(fc.property(texts, (tx) => {
    const segs = tx.map((_, i) => ({ index: i, start: i, end: i + 1 }));
    const { phrases } = propose(segs, tx, []);
    const expected = tx.filter((t) => t.qu.trim() && t.meaning.trim()).length;
    return phrases.length === expected && phrases.every((p) => normalize(p.qu) === normalize(tx[p.segment].qu));
  }));
});
