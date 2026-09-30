# Fieldnotes — Lead workspace

A modular Angular workspace for statewide business research and sales outreach. Angular uses the Express API; the API stores leads and district coverage in MongoDB.

## Install and start the app

```sh
npm install
cd ..\backend
npm install
cd ..\data_collector
```

Start the API and Angular app in separate terminals from the project root:

```sh
npm run start:api
```

```sh
npm start
```

The backend is the sibling folder `LEADS_DATA\backend`; `data_collector` contains only the Angular frontend. Its private `.env` is in the backend folder. Set `MONGODB_DB` to the database shown in Compass (configured as `leads_data`) and use the imported `leads` and `district_coverage` collections. Keep your existing `GEMINI_API_KEY` there for AI paste extraction.

After importing your CSV files into MongoDB, follow [MONGODB_SETUP.md](MONGODB_SETUP.md), set the expected row counts in `..\backend\.env`, and run `npm run normalize:csv` from `..\backend` before starting the API. This validates IDs, timestamps, numeric targets, and coverage keys, then normalizes CSV-imported types.

## Project structure

- `..\backend\src` — modular Express API, MongoDB models, controllers, routes, and Gemini service
- `src/app/core/data` — Angular client for the Express API
- `src/app/shared/models` — shared lead, coverage and district models
- `src/app/features/dashboard` — statewide reporting
- `src/app/features/leads` — lead directory and CRUD; API supports pagination and filters
- `src/app/features/coverage` — district research progress

## Build

```sh
npm run build
```
