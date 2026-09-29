-- Stores a Google Maps, directory, or other business profile URL separately from the company website.
alter table public.leads
  add column if not exists url text not null default '';
