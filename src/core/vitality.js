// The candle metaphor: each word's flame is its recall probability.
import { recall } from './srs.js';

/** Mean recall of all words, 0..1. An empty vocabulary is a dead language. */
export function vitality(cards, now) {
  if (!cards.length) return 0;
  const sum = cards.reduce((acc, c) => acc + recall(c, now), 0);
  return sum / cards.length;
}

/**
 * unlit   - never spoken yet
 * lit     - well remembered
 * flicker - fading, practise soon
 * ghost   - almost forgotten
 */
export function candleState(card, now) {
  if (card.lastReview == null) return 'unlit';
  const r = recall(card, now);
  if (r >= 0.66) return 'lit';
  if (r >= 0.25) return 'flicker';
  return 'ghost';
}

/** Practice order: unlit and fading words first, strongest last. Stable for ties. */
export function practiceQueue(cards, now) {
  return cards
    .map((c, i) => ({ c, i, r: recall(c, now) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.c);
}
