// Spaced-repetition scheduler (SM-2 variant) plus a forgetting curve.
// Pure module: no DOM, no storage, no clock. Every time value is passed in
// as epoch milliseconds so the logic can be property-tested.

export const DAY = 86_400_000;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const START_EASE = 2.5;

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** A word nobody has spoken yet: its candle is unlit. */
export function newCard(id, now) {
  return { id, ease: START_EASE, interval: 0, reps: 0, lapses: 0, lastReview: null, due: now };
}

/**
 * Record one practice attempt.
 * grade: integer 0..5 (0-2 = forgotten, 3 = hard, 4 = good, 5 = easy).
 * Returns a NEW card; the input is never mutated.
 */
export function review(card, grade, now) {
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    throw new RangeError(`grade must be an integer 0..5, got ${grade}`);
  }
  const q = 5 - grade;
  const ease = clamp(card.ease + (0.1 - q * (0.08 + q * 0.02)), MIN_EASE, MAX_EASE);

  let reps;
  let interval;
  let lapses = card.lapses;
  if (grade < 3) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else {
    reps = card.reps + 1;
    const next = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(card.interval * ease);
    interval = Math.max(next, card.interval, 1);
  }
  return { ...card, ease, reps, interval, lapses, lastReview: now, due: now + interval * DAY };
}

/**
 * Estimated probability (0..1) that the learner still remembers the word.
 * Half-life equals the current interval: at the due date the candle is at 50%.
 * Never-practised words return 0. A clock that runs backwards is clamped.
 */
export function recall(card, now) {
  if (card.lastReview == null) return 0;
  const elapsedDays = Math.max(0, now - card.lastReview) / DAY;
  const halfLife = Math.max(card.interval, 0.5);
  return Math.pow(2, -elapsedDays / halfLife);
}
