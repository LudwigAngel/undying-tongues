# ✒ Crew Scribes (Kiro Crew app)

Three AI scribes that help a family turn an elder's recorded stories into lessons for
[Undying Tongues](../README.md). They read the family's **transcripts, never the audio**, and
propose:

| Agent | Proposes | Example |
|---|---|---|
| `scribe-glossator` | a meaning for a transcribed segment that has none | `atuq urqupi` → "el zorro en el cerro" |
| `scribe-morphologist` | root + suffixes for words the app could not split | `wasiykunapi` → `wasi + -y + -kuna + -pi` |
| `scribe-orthographer` | accepted variant spellings | `urqu` → also accept `orqo` |

Every proposal goes through the `undying-archive` MCP server, which validates it with the same
JavaScript core the web app uses (and the property tests cover) and appends it to
`<archive>.suggestions.json`. The archive itself is never modified. The family imports the
suggestions file in the app and accepts or rejects each card.

## Install

Requires Node.js 18+ and Python 3 on the machine running Kiro Crew.

```powershell
kirocrew app install C:\path\to\undying-tongues\crew-scribes
kirocrew app enable crew-scribes
```

## Use

1. In the app: **Story harvest → Export family archive**. You get `family-YYYY-MM-DD.undying.json`.
2. In Kiro Crew, say: *"Run the Crew Scribes on C:\Users\me\Downloads\family-2026-11-24.undying.json, translate to Spanish."*
   The coordinator loads the `scribe-rules` skill, checks the archive and starts the three
   scribes in parallel.
3. In the app: **Story harvest → Import archive or suggestions**, choose the `.suggestions.json`
   file, open the story and accept or reject each suggestion.

## Tools (`undying-archive`)

| Tool | Access | Purpose |
|---|---|---|
| `archive_summary` | read, auto-approved | stories, segments, transcribed, missing meanings |
| `list_segments` | read, auto-approved | transcript and meaning per segment, tokens tagged known / analysable / unknown |
| `lookup_word` | read, auto-approved | known-word lookup and root + suffix analysis |
| `suffix_table` | read, auto-approved | Southern Quechua suffixes with glosses |
| `list_suggestions` | read, auto-approved | what was already proposed |
| `propose` | **write, asks you** | validate one suggestion and append it to the suggestions file |

## Development

`mcp/core/` and `mcp/data/` are generated copies of `src/core/` and `src/data/`. Edit the originals
and run `npm run sync:crew`; `npm test` fails if the copies drift.
