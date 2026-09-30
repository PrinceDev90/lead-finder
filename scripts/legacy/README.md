# Archived utilities

These are historical, one-off scripts. They are not part of the application and should not be run.

- `clean.js` edits the leads Angular component and template. It truncates the template at a paste-modal marker and removes paste-import code. Running it can delete current UI and feature code.
- `darken.js` recursively rewrites CSS color values across lead feature styles. It was a broad theme pass and may overwrite newer styling choices.
- `fix-html.js` applies literal copy/field substitutions to the old paste-lead template. Its assumptions may no longer match the current markup.
- `native-http-server.mjs` is the previous single-file Node HTTP server. The current API is the modular Express app in `backend/src/`.
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` are preserved only as history. This project now uses npm and `package-lock.json`.

The active API entry point is `backend/src/server.mjs`; use `npm run start:api` from the project root.
