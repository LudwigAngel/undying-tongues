# Contributing: bring another language back to the altar

Undying Tongues starts with Southern Quechua, but nothing in the core is Quechua-only. A community
can add its own language without touching the scheduler, the altar or the story harvest.

## Add a language pack
1. Copy `src/data/quechua.js` to `src/data/<language>.js` and fill in `LANGUAGE`, `DECKS` and,
   optionally, `DIALOGUE`. Mark it `reviewed: false` until a native speaker signs it off.
2. If the language builds words with suffixes, add its suffix table to `src/core/morph.js`
   (or a sibling file) with glosses in English and Spanish.
3. If its spelling has letters that look like punctuation (like the Quechua ejective apostrophe),
   add that rule to `src/core/answer.js` and a property for it in `test/answer.property.test.js`.
4. Run `npm test` and `npm run sync:crew`.

## Rules (from `.kiro/steering/language-ethics.md`)
- The family's variety is the reference. Never "correct" a speaker to a standard.
- Do not invent words or sentences. Short, well-attested items only.
- Recordings belong to the family: no upload, no training, no sharing without consent.

## Working with Kiro
Open the repo in Kiro: the steering, specs and hooks in `.kiro/` will guide the agent. A new
feature starts as a spec in `.kiro/specs/<name>/` with requirements, design and tasks, and every
logic requirement gets a property test named with its id.
