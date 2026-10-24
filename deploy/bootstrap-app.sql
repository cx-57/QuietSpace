-- Dedicated fresh PostgreSQL container only. Not a Supabase migration.
\set ON_ERROR_STOP on
\getenv app_password QUIETSPACE_APP_PASSWORD
create role quietspace_app login noinherit password :'app_password';
grant anon, service_role to quietspace_app;
