# MongoDB local setup and CSV migration validation

## Collections and models

The backend defaults to database `leads_data` with collections `leads` and `district_coverage`. Set `MONGODB_DB` in `backend/.env` to the exact database name shown in your Compass sidebar; use `MONGODB_LEADS_COLLECTION` and `MONGODB_COVERAGE_COLLECTION` if the collection names differ.

The Mongoose models match the current Angular contracts. They preserve each imported record ID as the API `id`; MongoDB's internal `_id` stays private to the API.

- `leads`: business/contact, industry, location, website, status, notes, and timestamp fields.
- `district_coverage`: state, district, progress status, numeric `target_leads`, notes, and timestamp fields.

The backend creates a unique lead-ID index and a unique `{ state, district }` index for coverage records.

## REST API

The Angular app keeps its existing `/api` contract:

| Method and path | Purpose |
| --- | --- |
| `GET /api/leads?limit=100&offset=0&state=&district=&industry=&city=&status=&websiteStatus=` | Filtered, paginated leads; responds with `{ items, total, limit, offset }` |
| `GET /api/leads/industry-stats` | Counts every industry, including `Uncategorized` |
| `POST /api/leads` and `POST /api/leads/bulk` | Add one or many leads |
| `PATCH /api/leads/:id` and `DELETE /api/leads/:id` | Edit or remove a lead |
| `GET /api/coverage` and `PATCH /api/coverage/:id` | Read or update district progress |
| `GET /api/health` | Check API and database connection |

Lead pagination uses an aggregation `$facet` so the requested page and matching total are returned from one database query. Industry counts use `$group` and `$sort`, so the dashboard gets category counts directly from MongoDB.

## After Compass CSV import

1. Keep the original CSV exports and source data available. Before switching the app, record exact row counts from the source tables in Supabase SQL Editor:

   ```sql
   select 'leads' as table_name, count(*) as row_count from public.leads
   union all
   select 'district_coverage', count(*) from public.district_coverage;
   ```

   Set those exact values as `EXPECTED_LEADS_COUNT` and `EXPECTED_COVERAGE_COUNT` in `backend/.env`. Do not assume the earlier count of 1,128 is still current.

2. Confirm in Compass that the CSV collections are under the database named by `MONGODB_DB`, and that they are named `leads` and `district_coverage` (or update the two collection settings).

3. Make a MongoDB backup before normalizing imported field types. `mongodump`/`mongorestore` are MongoDB's database backup tools; Compass import/export is not a backup strategy. See [mongodump](https://www.mongodb.com/docs/database-tools/mongodump/) and [mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/).

4. In PowerShell, install the backend packages and prepare its private settings:

   ```powershell
   cd ..\backend
   npm install
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

   Edit `.env`: set the exact `MONGODB_DB` from Compass and both expected row counts. Add `GEMINI_API_KEY` if you use AI paste extraction. Keep `.env` private and out of Git.

5. Still inside `backend`, run:

   ```powershell
   npm run normalize:csv
   ```

   The script checks both collections before making changes. It stops without writing if a collection is missing/empty, a configured row count differs from the source, IDs or state/district keys duplicate, dates are missing/invalid, or a target is not a non-negative whole number. If checks pass, it converts imported timestamp strings to BSON dates and CSV target strings to numbers. The operation is safe to rerun.

6. Start the API from the project root:

   ```powershell
   cd ..\data_collector
   npm run start:api
   ```

   Check `http://127.0.0.1:3000/api/health`; it should report `database: connected`. In a second terminal from the project root, run `npm start` for Angular.

7. Verify the dashboard and industry counts, lead filters, add/edit/delete, bulk paste save, and district progress updates. Compare counts again in Compass. Keep Supabase unchanged until these checks pass and you have a current MongoDB backup.

The API paths and response shapes remain under `/api`, so Angular continues using the same endpoints. Only the backend persistence changes. MongoDB runs locally on this PC; do not expose port 27017 publicly. A deployed Angular app will need a deployed/reachable API and database.
