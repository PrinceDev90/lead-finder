# Fieldnotes — Lead workspace

A modular Angular workspace for statewide business research and sales outreach. Leads and district coverage progress are stored in Supabase.

## Start the app

```sh
npm install
npm start
```

## Configure Supabase

The project URL and publishable key are configured in `src/environments/environment.ts`. Existing installs should run `supabase/migrations/20260928_district_workspace.sql` in the Supabase SQL Editor. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup and security details.

## Project structure

- `src/app/core/data` — Supabase data access
- `src/app/shared/models` — shared lead, coverage and district models
- `src/app/features/dashboard` — statewide reporting
- `src/app/features/leads` — lead directory and CRUD
- `src/app/features/coverage` — district research progress

## Build

```sh
npm run build
```
