# Requirements: Story Harvest

## Why
Single-word recordings are slow to collect and feel like a test to an elder. Elders prefer to tell
a story. Story Harvest turns one long, natural recording into many cards, all in that elder's voice.
There is no reliable speech recognition for Quechua varieties, so the family transcribes; the app
does the bookkeeping (cutting, proposing, deduplicating) so that transcription is the only work.

## H1 Recording
- H1.1 WHEN the user presses "Record a story" THEN the system SHALL record until Stop and store the audio on the device with title, speaker and measured duration.
- H1.2 The duration SHALL be measured by the app, because MediaRecorder WebM files often report `Infinity`.
- H1.3 IF the microphone is unavailable THEN the system SHALL say so in plain language.
- H1.4 Deleting a story SHALL ask for confirmation.

## H2 Cutting into segments
- H2.1 Cut marks SHALL stay sorted, strictly inside (0, duration), at least 0.25 s apart.
- H2.2 Segments SHALL cover the whole story exactly, in order, without gaps or overlaps; there is always one more segment than marks.
- H2.3 Joining two segments SHALL remove one mark and keep full coverage; the two transcripts are concatenated, never lost.
- H2.4 Editing marks SHALL NOT mutate the previous list (undo-safe).

## H3 Proposals
- H3.1 Tokenisation SHALL keep the ejective apostrophe and SHALL NOT produce empty tokens.
- H3.2 Proposed words SHALL be distinct, not already on the altar, and point to a segment where they are heard.
- H3.3 Word counts SHALL add up to the number of unknown tokens and be sorted by frequency.
- H3.4 Only segments with both a transcript and a meaning SHALL be proposed as phrase cards.

## H4 Approval
- H4.1 Nothing reaches the altar without a family member pressing "Add to altar".
- H4.2 A word card SHALL require a meaning before it is added.
- H4.3 An approved card SHALL play the exact segment of the story where it was heard.
- H4.4 Adding the same form twice SHALL be ignored.

## Out of scope here
Automatic transcription by AI agents. That is a separate, opt-in spec (`crew-scribes`) that works
on an exported family archive, so the public app never sends voices anywhere.
