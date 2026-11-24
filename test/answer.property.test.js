// Property-based tests for answer checking. Requirements: .kiro/specs/candle-altar/requirements.md (R4)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { normalize, isCorrect, startsWithAny } from '../src/core/answer.js';
import { ALL_WORDS } from '../src/data/quechua.js';

const word = fc.constantFrom(...ALL_WORDS);
const apostrophes = ["'", '\u2019', '\u02BC', '\u2018', '`', '\u00B4'];

const noise = (s) => fc.tuple(
  fc.constantFrom('', ' ', '  ', '\t'), fc.constantFrom('', '?', '!', '.', ' ?'), fc.boolean(),
).map(([pad, punct, upper]) => `${pad}${upper ? s.toUpperCase() : s}${punct}${pad}`);

test('R4.1 every accepted form is accepted, whatever the case, spacing or punctuation', () => {
  fc.assert(fc.property(word.chain((w) => fc.constantFrom(w.qu, ...(w.alt ?? [])).chain(noise).map((s) => [w, s])),
    ([w, s]) => isCorrect(s, [w.qu, ...(w.alt ?? [])])));
});

test('R4.2 any apostrophe glyph counts as the same letter', () => {
  fc.assert(fc.property(fc.constantFrom(...apostrophes), (a) => isCorrect(`p${a}unchay`, ["p'unchay"])));
});

test('R4.3 dropping the ejective apostrophe is an error (p\'unchay is not punchay)', () => {
  assert.equal(isCorrect('punchay', ["p'unchay"]), false);
  fc.assert(fc.property(word.filter((w) => w.qu.includes("'")), (w) => !isCorrect(w.qu.replace(/'/g, ''), [w.qu])));
});

test('R4.4 empty or whitespace-only input is never correct', () => {
  fc.assert(fc.property(fc.stringOf(fc.constantFrom(' ', '\t', '\n', '?', '!')), (s) => !isCorrect(s, ['inti', '?'])));
});

test('R4.5 normalize is idempotent', () => {
  fc.assert(fc.property(fc.fullUnicodeString(), (s) => normalize(normalize(s)) === normalize(s)));
});

test('R4.6 a different word from the deck is not accepted', () => {
  fc.assert(fc.property(word, word, (a, b) => {
    fc.pre(a.id !== b.id);
    const bForms = [b.qu, ...(b.alt ?? [])].map(normalize);
    fc.pre(!bForms.includes(normalize(a.qu)));
    return !isCorrect(a.qu, [b.qu, ...(b.alt ?? [])]);
  }));
});

test('R4.7 name answers need the prefix plus a name', () => {
  fc.assert(fc.property(fc.stringMatching(/^[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,12}$/), (name) =>
    startsWithAny(`Sutiyqa ${name}`, ['sutiyqa']) && !startsWithAny('Sutiyqa', ['sutiyqa'])));
});
