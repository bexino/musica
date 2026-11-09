# Repository Guidelines

## Project Structure & Module Organization

This is an offline stage lyrics player built with React and Vite. `src/main.jsx` contains the player and screen transitions, `src/subtitles.mjs` parses SRT files, and `src/style.css` defines the visual presentation. `src/components/AlbumBackground.jsx` wraps the Apple Music-like Lyrics album background. The Electron entry point is `electron/main.cjs`; `scripts/mhtml.mjs` creates and checks an MHTML snapshot. Successful EXE builds remove staging folders through `scripts/clean-staging.mjs`.

`attachments/` holds the fixed song assets: `music.mp3`, `cover.jpg`, `lyrics.srt`, `intro.md`, and optional `vocabulary.json`. Tests live in `tests/`. Build outputs are generated in `dist/`, `dist-single/`, and `release/`; do not edit them directly.

## Build, Test, and Development Commands

After every change, rebuild the deliverables with `npm run build:single` and `npm run build:exe` so the offline HTML and both portable Electron EXEs reflect the latest changes. Run the applicable tests and automated checks as well. If a build fails, report the failure and do not present stale outputs as updated.

- `npm install` installs dependencies from the lockfile.
- `npm run dev` starts the local Vite server.
- `npm test` runs the Node.js test suite.
- `npm run build` creates the standard production build in `dist/`.
- `npm run build:single` produces the offline `dist-single/index.html`.
- `npm run build:mhtml` generates an MHTML snapshot and tests offline playback. The existing Edge test has failed; do not assume the file is playable.
- `npm run build:exe` builds a portable Windows EXE for 32-bit and 64-bit systems in `release/`.

## Coding Style & Naming Conventions

Use ES modules for frontend code and preserve CommonJS in the Electron entry point. Follow the surrounding style, use two-space indentation for new multiline code, PascalCase for React components, and camelCase for functions and variables. Keep subtitle handling separate from presentation. No formatter or linter is configured; avoid unrelated formatting changes.

## Testing Guidelines

Tests use Node's built-in `node:test` and `node:assert/strict`; name files `*.test.mjs`. Run `npm test` after changes and add focused tests for meaningful parsing or behavior changes. For playback or visual changes, also verify the offline HTML and, when relevant, the Electron build: playback, bilingual synchronization, card transitions, and screen controls. No coverage threshold is configured. Perform each applicable check that can be automated in the current environment. If a check cannot be performed automatically, complete the remaining work and report exactly what was and was not verified and why; do not require manual verification or claim that unverified behavior or Windows 7 support has passed.

## Compatibility & Contributions

Keep runtime assets local and retain the compatibility mode. Electron 22 targets Windows 7; actual support requires testing on a Windows 7 device. This checkout has no Git history, so no commit convention can be inferred. Use clear, imperative commit messages; pull requests should describe the change and checks performed, with screenshots for visible UI changes.
