# Supabase source and rollback notes

Supabase was the source database for this workspace. Keep the project and its backup available until the MongoDB copy has been verified and the application has run successfully against MongoDB.

The original PostgreSQL schema is preserved in [`supabase/schema.sql`](supabase/schema.sql) and incremental changes are in [`supabase/migrations`](supabase/migrations). Those SQL files document the source schema; they are not run against MongoDB.

For source backups and PostgreSQL connection details, see the official [Supabase backup and restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) and [Postgres connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres).

The MongoDB target setup and validation steps are in [`MONGODB_SETUP.md`](MONGODB_SETUP.md).
