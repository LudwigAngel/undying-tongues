---
inclusion: always
---

# Tech rules

- **No build step.** Plain ES modules, HTML and CSS, served as static files (GitHub Pages).
  The dev host has ~1 GB free RAM; do not add bundlers, frameworks or dev servers that watch files.
- **Pure core.** Anything in `src/core/` is a pure function: no DOM, no `Date.now()`, no storage.
  Time is passed in as epoch milliseconds. This is what makes property-based testing possible.
- **Every requirement in a spec gets a property test** in `test/*.property.test.js` using
  `fast-check`, named with the requirement id (`R2.3 ...`). Example-based tests only for UI glue.
- Run tests with `npm test` (Node's built-in runner). No Jest, no Vitest.
- Storage: progress in `localStorage`, audio Blobs in IndexedDB (`src/storage.js`). Nothing is
  uploaded. If a future feature needs a server, it must be opt-in and documented in the spec.
- Accessibility: keyboard reachable, visible focus, `aria-live` for feedback,
  `prefers-reduced-motion` turns off every animation.
- UI strings live in `src/i18n.js` with both `en` and `es`. Never hardcode visible text in `app.js`.
- Windows dev machine: use PowerShell syntax in any command you suggest.
