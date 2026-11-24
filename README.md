# 🕯️ Undying Tongues · Lenguas que no mueren

**A language dies when its last voice goes quiet.** Undying Tongues lets elders record their
language in their own voice and turns each word into a candle on a family altar. Children keep the
candles lit by practising; when a word is forgotten, its flame fades into a ghost.

Built for **Kiroween 2026**, category **Resurrection**. Starting language: Southern Quechua (Runasimi).

## Why
Quechua has millions of speakers, but many children in Peru's cities grow up understanding it and
not speaking it. Language apps rarely cover Indigenous languages, and none use the grandmother's
own voice and the family's own variety. This app does, offline and on the device.

## Features
- **Altar**: one candle per word. The flame is the real probability you still remember the word
  (forgetting curve). The big flame shows the vitality of the language in your home.
- **Elder's voice**: record, play and delete each word in the speaker's own voice. Nothing is uploaded.
- **Keep it alive**: spaced-repetition practice (SM-2 variant). Weakest words come first. Type the
  answer or say it aloud and grade yourself. Answer checking understands Quechua spelling: any
  apostrophe glyph works, but the ejective apostrophe (`p'unchay`) is required.
- **Talk with the ancestor**: a short scripted conversation in Runasimi, with hints.
- English / Spanish interface, keyboard accessible, respects `prefers-reduced-motion`.

## Run it
No build step. Any static server works:

```powershell
npm install      # only installs fast-check for the tests
npm run serve    # http://127.0.0.1:5173
npm test         # 18 property-based tests
```

Live demo: _GitHub Pages URL goes here_.

## How Kiro was used
See [`docs/KIRO.md`](docs/KIRO.md). In short: steering for product, tech and language ethics,
a spec (`.kiro/specs/candle-altar`) whose every acceptance criterion maps to a `fast-check`
property, and hooks that re-run the properties, keep translations in sync and guard the vocabulary.

## Honest limits
- The seed vocabulary is a draft by non-native authors and is marked as unreviewed in the app.
- No Quechua speech recognition yet; learners grade their own spoken answers.

## License
[MIT](LICENSE)
