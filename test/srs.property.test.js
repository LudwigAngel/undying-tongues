// Property-based tests for the scheduler. Requirements: .kiro/specs/candle-altar/requirements.md (R2, R3)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { newCard, review, recall, DAY, MIN_EASE, MAX_EASE } from '../src/core/srs.js';
import { vitality, practiceQueue, candleState } from '../src/core/vitality.js';

const T0 = Date.UTC(2026, 10, 1);
const grade = fc.integer({ min: 0, max: 5 });
const history = fc.array(fc.tuple(grade, fc.integer({ min: 0, max: 60 * DAY })), { maxLength: 40 });

function play(steps) {
  let card = newCard('w', T0);
  let now = T0;
  const seen = [card];
  for (const [g, gap] of steps) {
    now += gap;
    card = review(card, g, now);
    seen.push(card);
  }
  return { card, now, seen };
}

test('R2.1 ease always stays within [MIN_EASE, MAX_EASE]', () => {
  fc.assert(fc.property(history, (steps) =>
    play(steps).seen.every((c) => c.ease >= MIN_EASE && c.ease <= MAX_EASE)));
});

test('R2.2 the next due date is always in the future, at least one day away', () => {
  fc.assert(fc.property(history, grade, (steps, g) => {
    const { card, now } = play(steps);
    const next = review(card, g, now);
    return next.due >= now + DAY && next.interval >= 1;
  }));
});

test('R2.3 a successful review never shortens the interval', () => {
  fc.assert(fc.property(history, fc.integer({ min: 3, max: 5 }), (steps, g) => {
    const { card, now } = play(steps);
    return review(card, g, now).interval >= card.interval;
  }));
});

test('R2.4 forgetting resets the streak and counts a lapse', () => {
  fc.assert(fc.property(history, fc.integer({ min: 0, max: 2 }), (steps, g) => {
    const { card, now } = play(steps);
    const next = review(card, g, now);
    return next.reps === 0 && next.interval === 1 && next.lapses === card.lapses + 1;
  }));
});

test('R2.5 review is pure: the input card is not mutated', () => {
  fc.assert(fc.property(history, grade, (steps, g) => {
    const { card, now } = play(steps);
    const before = JSON.stringify(card);
    review(card, g, now);
    return JSON.stringify(card) === before;
  }));
});

test('R2.6 invalid grades are rejected', () => {
  fc.assert(fc.property(fc.oneof(fc.integer({ min: 6 }), fc.integer({ max: -1 }), fc.double({ noInteger: true })), (g) => {
    assert.throws(() => review(newCard('w', T0), g, T0), RangeError);
  }));
});

test('R3.1 recall is a probability and only fades with time', () => {
  fc.assert(fc.property(history, fc.nat(400 * DAY), fc.nat(400 * DAY), (steps, a, b) => {
    const { card, now } = play(steps);
    const [early, late] = a <= b ? [a, b] : [b, a];
    const r1 = recall(card, now + early);
    const r2 = recall(card, now + late);
    return r1 >= 0 && r1 <= 1 && r2 <= r1;
  }));
});

test('R3.2 a clock that runs backwards never produces recall above 1', () => {
  fc.assert(fc.property(history, fc.nat(30 * DAY), (steps, back) => {
    const { card, now } = play(steps);
    const r = recall(card, now - back);
    return r >= 0 && r <= 1;
  }));
});

test('R3.3 vitality is the mean of recall and lies in [0, 1]', () => {
  fc.assert(fc.property(fc.array(history, { maxLength: 15 }), (hs) => {
    const list = hs.map((h) => play(h).card);
    const now = T0 + 400 * DAY;
    const v = vitality(list, now);
    return v >= 0 && v <= 1;
  }));
});

test('R3.4 practice queue is a permutation ordered from weakest to strongest', () => {
  fc.assert(fc.property(fc.array(history, { maxLength: 15 }), (hs) => {
    const list = hs.map((h, i) => ({ ...play(h).card, id: `w${i}` }));
    const now = T0 + 90 * DAY;
    const q = practiceQueue(list, now);
    assert.deepEqual([...q.map((c) => c.id)].sort(), list.map((c) => c.id).sort());
    for (let i = 1; i < q.length; i++) assert.ok(recall(q[i - 1], now) <= recall(q[i], now));
  }));
});

test('R3.5 a word never spoken is unlit; just after a good review it is lit', () => {
  fc.assert(fc.property(fc.integer({ min: 3, max: 5 }), (g) => {
    const c = newCard('w', T0);
    return candleState(c, T0) === 'unlit' && candleState(review(c, g, T0), T0) === 'lit';
  }));
});
