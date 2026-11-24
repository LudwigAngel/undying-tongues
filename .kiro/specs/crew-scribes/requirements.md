# Requirements: Crew Scribes

## Why
Transcribing is the family's job (see story-harvest). Translating every segment, explaining how
long agglutinative words are built, and listing accepted spellings is slow, and that is where AI
can help, if it is kept on a short leash. Crew Scribes is a Kiro Crew app: three agents and one MCP
server that only reads family transcripts and only writes suggestions.

## S1 Least-privilege MCP server (`undying-archive`)
- S1.1 The server SHALL only open absolute paths ending in `.undying.json` that pass archive validation.
- S1.2 The server SHALL NOT return audio in any tool result.
- S1.3 The only file the server writes SHALL be `<archive>.suggestions.json`, atomically (write temp, rename).
- S1.4 Read-only tools SHALL be auto-approved; `propose` SHALL require the user's approval in Kiro Crew.

## S2 Word breakdown (shared by the app and the server)
- S2.1 An analysis SHALL rebuild the exact word from its parts.
- S2.2 The root of an automatic analysis SHALL be a word the family already knows (no invented roots).
- S2.3 A known word SHALL analyse to itself with no suffixes.
- S2.4 Formatting and parsing an analysis SHALL round-trip.

## S3 Suggestions
- S3.1 A `meaning` suggestion SHALL be rejected when the family already wrote one, or when the segment has no transcript.
- S3.2 Applying any suggestion SHALL NOT change a transcript or an existing meaning.
- S3.3 A `morph` suggestion SHALL rebuild its token.
- S3.4 An `alt` spelling SHALL NOT drop an ejective apostrophe.
- S3.5 Every suggestion SHALL name its agent, a rationale and a confidence (low, medium, high).
- S3.6 Duplicate suggestions SHALL be rejected.
- S3.7 The app SHALL re-validate suggestions on import and again on accept; an invalid one is marked stale, not applied.

## S4 Archive
- S4.1 Export SHALL contain stories (with audio), marks, transcripts, notes and family words.
- S4.2 Import SHALL accept an archive (merging stories and family words by id) or a suggestions file.

## S5 Packaging
- S5.1 The app folder SHALL ship an exact copy of the web core; a check fails the tests on drift.
- S5.2 Agents SHALL be allowed only the `undying-archive` tools, `fs_read` and `thinking`.
