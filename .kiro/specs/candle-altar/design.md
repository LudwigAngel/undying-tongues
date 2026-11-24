# Design: Candle Altar

## Architecture

```
index.html ── src/app.js (views, DOM) ──┬── src/core/srs.js       pure: newCard, review, recall
                                         ├── src/core/vitality.js  pure: vitality, candleState, practiceQueue
                                         ├── src/core/answer.js    pure: normalize, isCorrect, startsWithAny
                                         ├── src/data/quechua.js   seed decks + scripted dialogue
                                         ├── src/i18n.js           en / es strings
                                         └── src/storage.js        localStorage (cards) + IndexedDB (voices)
```

No build step; GitHub Pages serves the repo root.

## Scheduling model
SM-2 variant. `ease += 0.1 - q(0.08 + 0.02q)` with `q = 5 - grade`, clamped to [1.3, 3.0].
Intervals 1, 3, then `round(interval * ease)`, never below the previous interval on success.

## Forgetting curve (the candle)
`recall = 2^(-elapsedDays / halfLife)` with `halfLife = max(interval, 0.5)`. At the due date the flame
is at 50%. States: `lit` >= 0.66, `flicker` >= 0.25, `ghost` below, `unlit` if never reviewed.
Vitality is the mean recall and drives the big flame on the altar (CSS variable `--v`).

## Data model
```js
Card  = { id, ease, interval /*days*/, reps, lapses, lastReview /*ms|null*/, due /*ms*/ }
Word  = { id, qu, en, es, alt?: string[] }
Voice = { blob: Blob, elder: string, recordedAt: ms }   // IndexedDB key = word id
```

## Correctness properties (mapped to tests)
Every R2-R4 criterion is a `fast-check` property in `test/`. The generators produce arbitrary review
histories (up to 40 reviews, gaps up to 60 days), so the invariants are checked over thousands of
schedules, not three hand-picked ones.

## Out of scope for the MVP
Speech recognition of Quechua, cloud sync, teacher dashboard. See tasks.md "Next".
