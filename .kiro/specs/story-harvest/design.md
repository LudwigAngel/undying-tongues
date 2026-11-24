# Design: Story Harvest

```
src/views/harvest.js  (DOM)  ── src/core/harvest.js (pure)  addMark, removeMark, segmentsFrom, tokenize, propose
        │                                                  └─ reuses normalize() from core/answer.js
        └── src/storage.js   IndexedDB v2: stores "voices" + "stories"; localStorage "family" words
```

## Data
```js
Story      = { id, title, elder, blob, duration /*s*/, recordedAt, marks: number[], texts: [{ qu, meaning }] }
FamilyWord = { id: 'fam-<story>-<form>', qu, en, es, from: storyTitle, clip: { storyId, start, end } }
```
`texts[i]` belongs to `segmentsFrom(marks, duration)[i]`. Joining segment i with i-1 splices both
texts into one before removing mark i-1, so indices stay aligned.

## Playback of a clip
`playClip(blob, start, end)` seeks to `start` after `loadedmetadata` and pauses on the first
`timeupdate` past `end`. Only one clip plays at a time.

## Why the family transcribes
Quechua ASR is weak and variety-specific; a wrong automatic transcript taught to a child is worse
than none. The steering (`language-ethics.md`) makes the family the authority. AI help comes later
as suggestions in the `crew-scribes` spec, always reviewed by a person.
