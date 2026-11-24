# Requirements: Candle Altar (MVP)

## R1 Elder recording
**User story:** As an elder, I want to record a word in my own voice so my grandchildren learn it the way our family says it.

- R1.1 WHEN the elder presses Record on a word THEN the system SHALL capture microphone audio until Stop is pressed.
- R1.2 WHEN a recording stops THEN the system SHALL store it on the device with the speaker's name and timestamp.
- R1.3 IF microphone access is denied THEN the system SHALL show a plain-language message and keep working.
- R1.4 The elder SHALL be able to play and delete each recording.

## R2 Scheduling (spaced repetition)
**User story:** As a child, I want the app to bring back words right before I forget them.

- R2.1 The ease factor SHALL always stay within [1.3, 3.0].
- R2.2 After any review the next due date SHALL be at least one day in the future.
- R2.3 A successful review (grade >= 3) SHALL never shorten the interval.
- R2.4 A failed review (grade < 3) SHALL reset the streak, set the interval to 1 day and count a lapse.
- R2.5 Reviewing SHALL NOT mutate the previous card state.
- R2.6 Grades outside the integers 0..5 SHALL be rejected.

## R3 Candles and vitality
**User story:** As a family, we want to see at a glance how alive our language is at home.

- R3.1 Recall probability SHALL be in [0, 1] and SHALL NOT increase as time passes without practice.
- R3.2 A device clock that moves backwards SHALL NOT produce recall above 1.
- R3.3 Language vitality SHALL be the mean recall of all words, in [0, 1]; 0 for an empty vocabulary.
- R3.4 The practice queue SHALL contain every word exactly once, ordered from weakest to strongest recall.
- R3.5 A never-practised word SHALL be shown unlit; a word just recalled correctly SHALL be shown lit.

## R4 Answer checking
**User story:** As a child typing on a phone, I want to be marked right when I am right, even with odd keyboards.

- R4.1 Case, surrounding spaces and punctuation SHALL NOT make a correct answer wrong.
- R4.2 All apostrophe glyphs SHALL be treated as the same letter.
- R4.3 Omitting an ejective apostrophe SHALL be marked wrong.
- R4.4 Empty or whitespace-only input SHALL never be correct.
- R4.5 Normalisation SHALL be idempotent.
- R4.6 A different word from the deck SHALL NOT be accepted.
- R4.7 Name answers SHALL require the prefix (`Sutiyqa`) followed by a name.

## R5 Talk with the ancestor
- R5.1 A scripted, fictional ancestor SHALL ask questions in Runasimi with a gloss in the UI language.
- R5.2 Correct answers advance the conversation; wrong answers get a patient retry, never a penalty.
- R5.3 A hint SHALL be available for every turn.

## R6 Accessibility and language
- R6.1 All visible text SHALL be available in English and Spanish.
- R6.2 With `prefers-reduced-motion`, no animation SHALL play.
- R6.3 Every action SHALL be reachable by keyboard.
