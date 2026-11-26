# Devpost submission text (copy into the form)

**Category:** Resurrection · **Bonus:** Best Ghost of Kiroween Past, Best Kiro Crew App (+ Blog, Social Blitz if posted)

## Tagline (≤ 200 chars)
An elder tells a story; their grandchild learns the language in that same voice. Spaced repetition
for endangered languages, starting with Quechua, built with Kiro specs, hooks, MCP and Kiro Crew.

## In 30 seconds
- **What:** a free web app where a grandparent records stories and words in their language, and
  each word becomes a candle their grandchild keeps lit by practising. Forget a word and its flame
  fades into a ghost.
- **Who:** families and community teachers of endangered languages. First language: Southern
  Quechua (Runasimi), spoken by millions in Peru, but often lost by children in cities.
- **Why it matters:** a language dies when the last generation stops speaking it at home. Language
  apps don't cover most Indigenous languages and never use the family's own voice and variety.

## Inspiration
In Peru, many children understand Quechua but no longer speak it. The voice that could teach them is
at home: their grandmother's. We wanted to *resurrect* the oldest learning technology there is (an
elder telling a story) and give it today's tools: spaced repetition, a forgetting curve, and AI
helpers that work for the family instead of replacing it.

## What it does
1. **Story harvest:** the elder records a whole story, no vocabulary test. The family cuts it into
   phrases with one button, writes what was said, and approves phrases and words. Each becomes a card
   that plays *that exact part* of the story.
2. **Words explained:** Quechua glues suffixes onto roots. When the root is known, the app shows how
   a word is built (`wasiykunapi` → `wasi + -y + -kuna + -pi`, "in my houses"), offline and with no AI.
3. **Keep it alive:** practice ordered from weakest to strongest word (SM-2 variant). Answer checking
   understands Quechua spelling: any apostrophe glyph works, but the ejective apostrophe is required
   (`p'unchay`, "day", is not `punchay`).
4. **The altar:** one candle per word. The flame is the real probability you still remember it; the
   big flame is the vitality of the language in your home.
5. **Nina, the candle spirit:** a small ghost guide who always says what to press next, with a
   little mischief ("Say it out loud first, then reveal. The neighbours will survive.").
6. **Crew Scribes (Kiro Crew app):** three AI agents (Glossator, Morphologist, Orthographer) read the
   exported transcripts, *never the audio*, and suggest meanings, word breakdowns and accepted
   spellings. Every suggestion is validated before it is saved and applied only when a family member
   presses Accept.

Everything runs on the device: no account, no server, recordings never leave the phone.

## How we built it (Kiro)
- **Spec-driven development:** three specs in `.kiro/specs/` (`candle-altar`, `story-harvest`,
  `crew-scribes`) with EARS-style requirements. Every logic requirement has a property-based test with
  the same id (`R2.3`, `H2.2`, `S3.2`…), so a requirement, its test and its failure message match.
- **Property-based testing (fast-check):** 36 properties plus an end-to-end MCP test (38 tests).
  They check invariants over thousands of random review histories, story cuts and Unicode inputs:
  recall never rises without practice, segments always cover the story with no gaps, an AI
  suggestion can never overwrite family text, a word breakdown must rebuild the word.
- **Steering:** `product.md` and `tech.md` (always on) plus `language-ethics.md`, loaded only when
  vocabulary or answer checking is edited. It encodes Quechua orthography and the rules "the AI is not
  a native speaker", "never invent words", "voices belong to the family". This is what kept the agent
  from "helpfully" stripping the apostrophe that distinguishes two Quechua words.
- **Hooks:** four. They re-run the properties when the core changes, keep English and Spanish strings
  in sync, check vocabulary edits against the ethics steering, and re-sync the core into the Crew app
  and run the MCP test.
- **MCP:** a custom least-privilege server, `undying-archive`, with six tools. Five are read-only and
  auto-approved. The only write, `propose`, validates with the same JavaScript core the web app uses,
  so the agents' guardrails are tested code, not a prompt.
- **Kiro Crew:** the whole project was built in Kiro Crew, on a Windows machine with about 1 GB of
  free RAM. That constraint shaped the stack (no build step, no framework). Crew Scribes is packaged
  as a Kiro Crew app (`crew-scribes/`) with three custom agents, a skill that tells the coordinator to
  run them in parallel with `spawn_run`, and the MCP server.

Full write-up: `docs/KIRO.md` in the repo.

## Challenges
- No reliable speech recognition exists for Quechua varieties, so we made the family the transcriber
  and made the app do all the bookkeeping around it.
- Agglutinative words: a naive tokenizer treats `urqupi` and `urqu` as unrelated. A root-anchored
  analyser that never invents roots solved it without AI.
- Keeping AI honest with a living language: confidence levels, mandatory rationale, no overwriting,
  and a person approves every change.

## What's next
- Native-speaker review of the seed vocabulary (marked as unreviewed in the app today).
- Language packs: Aymara, Asháninka, Shipibo… The core is language-agnostic; see `CONTRIBUTING.md`.
- Offline install (PWA) and family-to-family sharing of archives.

## Built with
Kiro, Kiro Crew, Kiro specs, Kiro hooks, Kiro steering, MCP, JavaScript (ES modules), HTML, CSS,
IndexedDB, MediaRecorder API, fast-check, Node.js test runner, Python (MCP stdio server), GitHub Pages

## Links
- App: https://ludwigangel.github.io/undying-tongues/
- Code: https://github.com/LudwigAngel/undying-tongues
- Kiro Crew app: https://github.com/LudwigAngel/undying-tongues/tree/main/crew-scribes

## Testing instructions (judges only)
No login. Open the app link in Chrome or Edge (desktop or Android).
1. *Altar:* press "Light the first candle" and answer a few cards.
2. *Story harvest:* "Import archive or suggestions" → choose `demo/atuqmanta-demo.undying.json`
   from the repo, then import `demo/atuqmanta-demo.suggestions.json`. Open the story and accept or
   reject the scribes' suggestions. (The demo audio is silent; record your own story to hear a voice.)
3. *Crew Scribes:* `kirocrew app install <repo>/crew-scribes`, enable it, and ask the crew to
   "run the Crew Scribes on <absolute path to the demo archive>".
