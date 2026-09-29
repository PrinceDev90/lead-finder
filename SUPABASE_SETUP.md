# Supabase setup

This workspace uses the Supabase URL and publishable key in `src/environments/environment.ts`.

## Existing project

Your leads table is already set up. To enable district/state grouping and coverage tracking, open the Supabase SQL Editor and run [`supabase/migrations/20260928_district_workspace.sql`](supabase/migrations/20260928_district_workspace.sql). It adds Gujarat and district fields to existing leads, seeds the Gujarat district plan, and creates the district coverage table. Existing leads are assigned to Amreli; their city/area values are preserved. Also run [`supabase/migrations/20260929_add_business_url.sql`](supabase/migrations/20260929_add_business_url.sql) to add a separate business listing URL column.

## New project

Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor. It creates the leads and district coverage tables together.

## App structure

- `src/app/core/data`: Supabase data access
- `src/app/shared/models`: lead, coverage and Gujarat district types/catalog
- `src/app/features/dashboard`: statewide totals, industry mix and recent leads
- `src/app/features/leads`: lead search, filters and CRUD
- `src/app/features/coverage`: district progress management

The dashboard calculates its totals from saved leads and coverage records. The prototype SQL policies allow anonymous database access. Keep the project private and replace these with Supabase Auth and per-user row-level security before exposing the app publicly or to multiple users.

## AI-assisted lead paste

The **Paste leads** action calls the separate Node.js API in `backend/`. It reads the Gemini API key from `backend/.env`; the key is not sent to Angular. The API sends the paste to Gemini 3.5 Flash-Lite using `generateContent` with structured JSON output, then returns an editable preview. It does not insert anything into `leads`; use the preview's **Save** button to confirm the insert.

1. Keep Node.js 22 and npm installed. Copy `backend/.env.example` to `backend/.env` if `backend/.env` does not exist.
2. Create or rotate a Gemini API key in Google AI Studio. Set `GEMINI_API_KEY` in `backend/.env`. Never commit this file or put the key in Angular environment files.
3. The defaults are `https://generativelanguage.googleapis.com/v1beta` and `gemini-3.5-flash-lite`.
4. Run `npm run start:api` in one terminal and `npm start` in another. The Angular dev proxy forwards `/api` to the backend on port 3000.

The API listens only on `127.0.0.1`, accepts up to 30,000 input characters and returns at most 25 leads. Gemini 3.5 Flash-Lite supports structured outputs. [Gemini 3.5 Flash-Lite model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [Gemini structured output guide](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
