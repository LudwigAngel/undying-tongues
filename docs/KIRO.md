# How Kiro was used (draft, updated as the build goes)

## Kiro Crew
The project was started in Kiro Crew on a Windows machine with about 1 GB of free RAM. That
constraint shaped the stack: the steering forbids bundlers and file watchers, so the whole app is
static ES modules and the only dependency is `fast-check` for tests.

## Steering (`.kiro/steering/`)
- `product.md` (always): users, core loop, and the rule that the Halloween theme must carry meaning
  and stay respectful (altars and candles, no horror imagery around Indigenous people).
- `tech.md` (always): pure core, no build step, every requirement gets a property test.
- `language-ethics.md` (fileMatch on vocabulary and answer checking): Quechua orthography
  (ejective apostrophes, aspiration, 1975 vs 1985 alphabets) and content rules (the AI is not a
  native speaker; never invent words; recordings belong to the family). This file is what made
  the agent keep `p'unchay` distinct from `punchay` instead of "helpfully" stripping punctuation.

## Spec-driven development (`.kiro/specs/candle-altar/`)
`requirements.md` uses EARS-style criteria (R1-R6). `design.md` fixes the scheduling formula and the
forgetting curve. `tasks.md` tracks the build. Each R2-R4 criterion is a named property in
`test/*.property.test.js`, so a requirement, its test and its failure message share the same id.

## Property-based testing
18 properties over random review histories (up to 40 reviews, gaps up to 60 days) and random
Unicode input. Examples of what they guard: recall can never rise without practice; a clock that
runs backwards cannot push recall above 1; normalisation is idempotent; dropping an ejective
apostrophe is always wrong.

## Hooks (`.kiro/hooks/`)
- `core-properties`: editing `src/core/**` re-runs the properties and fixes the code, not the property.
- `i18n-parity`: editing UI files checks that English and Spanish have the same keys.
- `vocabulary-guard`: editing vocabulary re-checks it against the language-ethics steering.

## MCP and Kiro Crew app (`crew-scribes/`)
A custom MCP server, `undying-archive`, gives three Crew agents (Glossator, Morphologist,
Orthographer) a least-privilege view of a family archive: text only, no audio, and the only write is
`propose`, which validates each suggestion with the same core the web app uses and appends it to a
separate file. The validation rules are property-tested (S2, S3), so the guardrails on the agents
are the same code the tests check, not a prompt. The skill `scribe-rules` tells the coordinator to
run the three scribes in parallel with `spawn_run`. A hook re-syncs the core into the app and re-runs
the stdio MCP test whenever the core changes.

## Still to write
Custom agents in practice (a real run on a recorded story), and what changed versus vibe coding.
