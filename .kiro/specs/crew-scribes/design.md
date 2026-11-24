# Design: Crew Scribes

```
 Undying Tongues (browser)                         Kiro Crew
 ──────────────────────────                        ─────────────────────────────────────────
 Story harvest ─ Export ─▶ family.undying.json ─▶ coordinator (skill scribe-rules)
                                                      │ spawn_run, 3 tasks in parallel
                                                      ├─ scribe-glossator      meanings
                                                      ├─ scribe-morphologist   root + suffixes
                                                      └─ scribe-orthographer   accepted spellings
                                                            │ MCP: undying-archive (server.py)
                                                            │   └─ node cli.mjs ─ mcp/core/* (copy of src/core)
 Story harvest ◀─ Import ◀─ family.suggestions.json ◀───────┘   propose() validates, appends
   └ inbox: Accept / Reject, re-validated on device
```

## Why Python wraps Node
Kiro Crew resolves a bare `python` launcher with a relative `.py` path to the app root, so the server
starts from any install location. The rules live in one place, the JavaScript core that the web app
uses and the property tests cover; `server.py` is a 120-line JSON-RPC shell with no dependencies.

## Why the agents never hear the audio
Voices are personal data of elders, often of people who have died. The steering forbids sending
them anywhere. Text is enough for the three tasks the scribes do.

## Automatic vs. agent breakdowns
`analyse()` splits a word only when the root is already known to the family, so the app can show
`urqu + -pi (in, at, on)` with no AI and no risk. Unknown roots are the Morphologist's job, and its
proposals arrive with low confidence until a speaker confirms the root.
