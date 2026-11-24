---
inclusion: fileMatch
fileMatchPattern: ["src/data/**", "src/core/answer.js", "test/answer*"]
---

# Working with Quechua (Runasimi) and other endangered languages

## Orthography (Southern Quechua, Cusco-Collao)
- The apostrophe marks an **ejective** consonant and is a letter: `p'unchay` (day), `t'anta` (bread),
  `q'ipi` (bundle). Dropping it changes or breaks the word, so answer checking must treat it as required.
- Phones produce many apostrophe glyphs (' ' ʼ ` ´). They are the same letter: normalise them.
- `h` after a consonant marks aspiration (`khipu`, `phisqa`): it is also a letter, not noise.
- Spelling varies by region and by the 1975 vs 1985 official alphabets (`orqo`/`urqu`,
  `pichqa`/`phisqa`). Accept documented variants through the `alt` list; never pick one as "correct"
  over the family's own usage.

## Content rules
- You (the AI) are not a native speaker. Mark any new vocabulary as `reviewed: false` and say so
  in the UI footer. Do not invent words, sentences or grammar; prefer short, well-attested items.
- Never generate text that claims to be the voice of a real elder or a deceased person.
  The "ancestor" dialogue is a scripted, clearly fictional character.
- Recordings belong to the family. No upload, no training on them, no sharing without explicit
  consent per recording.
- Cultural framing: altars and candles honour the dead. No horror imagery attached to Indigenous people.
