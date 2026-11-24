// Story Harvest: turn one long recording of an elder into practice cards.
// Pure module (see .kiro/specs/story-harvest). Times are seconds (floats).
import { normalize } from './answer.js';

/** Add a cut mark. Marks stay sorted, unique (within 0.25 s) and strictly inside (0, duration). */
export function addMark(marks, t, duration) {
  if (!Number.isFinite(t) || !(duration > 0)) return marks.slice();
  const x = Math.round(t * 100) / 100;
  if (x <= 0 || x >= duration) return marks.slice();
  if (marks.some((m) => Math.abs(m - x) < 0.25)) return marks.slice();
  return [...marks, x].sort((a, b) => a - b);
}

export function removeMark(marks, index) {
  return marks.filter((_, i) => i !== index);
}

/** Contiguous segments that cover [0, duration] exactly, one more than the number of marks. */
export function segmentsFrom(marks, duration) {
  const cuts = [0, ...marks.filter((m) => m > 0 && m < duration).sort((a, b) => a - b), duration];
  const out = [];
  for (let i = 0; i < cuts.length - 1; i++) out.push({ index: i, start: cuts[i], end: cuts[i + 1] });
  return out;
}

/** Words of a transcript: normalized, keeps the ejective apostrophe, drops digits-only tokens. */
export function tokenize(text) {
  return normalize(text)
    .split(' ')
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter((w) => /\p{L}/u.test(w));
}

/**
 * Proposals for the family to approve.
 *  phrases: transcribed segments that also have a meaning (ready to become a card).
 *  words:   distinct tokens not already known, most frequent first, then by first appearance.
 *           Each points at the first segment where it is heard, so it plays in the elder's voice.
 */
export function propose(segments, texts, knownForms = []) {
  const known = new Set(knownForms.map(normalize));
  const phrases = [];
  const seen = new Map();
  let order = 0;
  segments.forEach((seg, i) => {
    const t = texts[i] ?? {};
    const qu = (t.qu ?? '').trim();
    if (!qu) return;
    if ((t.meaning ?? '').trim() && !known.has(normalize(qu))) {
      phrases.push({ qu, meaning: t.meaning.trim(), segment: seg.index });
    }
    for (const w of tokenize(qu)) {
      if (known.has(w)) continue;
      const hit = seen.get(w);
      if (hit) hit.count += 1;
      else seen.set(w, { form: w, count: 1, segment: seg.index, order: order++ });
    }
  });
  const words = [...seen.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .map(({ order: _o, ...rest }) => rest);
  return { phrases, words };
}
