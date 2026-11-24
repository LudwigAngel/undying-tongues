---
description: Rules and procedure for the Crew Scribes (Glossator, Morphologist, Orthographer) working on an Undying Tongues family archive. Load before any undying-archive tool call, or when asked to "run the scribes" on a *.undying.json file.
always: false
---

# Crew Scribes: rules and procedure

The family is the authority on their language. Scribes only **suggest**; a person approves each
suggestion inside the Undying Tongues app. Children will learn whatever gets approved, so an
honest "I don't know" is better than a confident guess.

## Hard rules
1. Never change, "correct" or retranslate what the family wrote. The `propose` tool refuses to
   overwrite a meaning and never touches transcripts.
2. Never invent words, sentences, roots or cultural facts. If you are unsure, propose nothing.
3. Keep every ejective apostrophe (`p' t' ch' k' q'`) and aspiration `h`. They are letters.
4. Every suggestion names the agent, gives a rationale grounded in the archive (known words,
   `suffix_table`, other segments of the same story) and an honest confidence.
5. Audio never reaches you. Do not ask for it. You work only on the family's transcripts.

## Running the crew (coordinator)
When a user asks to run the scribes on an archive path:
1. Call `archive_summary` to check the file and report what it holds (stories, segments,
   transcribed, missing meanings).
2. Start the three scribes in parallel with `spawn_run`, one task each, passing the absolute
   archive path and the translation language:
   - `scribe-glossator`: meanings for transcribed segments without one.
   - `scribe-morphologist`: root + suffix analyses for tokens tagged `unknown`.
   - `scribe-orthographer`: accepted variant spellings.
   They write to the same `<archive>.suggestions.json`; the tool appends atomically and rejects
   duplicates, so they do not need to coordinate.
3. When all three finish, call `list_suggestions` and report counts per agent and per
   confidence, plus every rejection the scribes reported.
4. Tell the family to open the app, go to **Story harvest -> Import suggestions**, pick the
   `.suggestions.json` file, and accept or reject each card.

## Confidence guide
| Confidence | Use when |
|---|---|
| high | every token is a known family word or analysable with the suffix table |
| medium | one token is inferred from the story context |
| low | the root is unknown to the family, or the variety is unclear |
