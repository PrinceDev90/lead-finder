-- Run this in Supabase Dashboard → SQL Editor.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  state text not null default 'Gujarat',
  district text not null default 'Amreli',
  city text not null default 'Amreli',
  phone text not null default '',
  email text not null default '',
  url text not null default '',
  website text not null default '',
  "websiteStatus" text not null default 'Unknown'
    check ("websiteStatus" in ('No website', 'Needs improvement', 'Has website', 'Unknown')),
  about text not null default '',
  source text not null default '',
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Qualified', 'Proposal sent', 'Won', 'Lost')),
  notes text not null default '',
  "aiSuggestion" text not null default '',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- This starter app uses the anon key directly and is intended for a trusted, single-user workspace.
-- For a public/multi-user deployment, replace these broad policies with authenticated-user policies.
create policy "anon can read leads" on public.leads for select to anon using (true);
create policy "anon can add leads" on public.leads for insert to anon with check (true);
create policy "anon can update leads" on public.leads for update to anon using (true) with check (true);
create policy "anon can delete leads" on public.leads for delete to anon using (true);

create table if not exists public.district_coverage (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  district text not null,
  status text not null default 'Not started'
    check (status in ('Not started', 'Researching', 'Covered')),
  target_leads integer not null default 25 check (target_leads >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (state, district)
);

insert into public.district_coverage (state, district, status) values
  ('Gujarat', 'Ahmedabad', 'Not started'), ('Gujarat', 'Amreli', 'Researching'),
  ('Gujarat', 'Anand', 'Not started'), ('Gujarat', 'Aravalli', 'Not started'),
  ('Gujarat', 'Banaskantha', 'Not started'), ('Gujarat', 'Bharuch', 'Not started'),
  ('Gujarat', 'Bhavnagar', 'Not started'), ('Gujarat', 'Botad', 'Not started'),
  ('Gujarat', 'Chhota Udepur', 'Not started'), ('Gujarat', 'Dahod', 'Not started'),
  ('Gujarat', 'Dang', 'Not started'), ('Gujarat', 'Devbhoomi Dwarka', 'Not started'),
  ('Gujarat', 'Gandhinagar', 'Not started'), ('Gujarat', 'Gir Somnath', 'Not started'),
  ('Gujarat', 'Jamnagar', 'Not started'), ('Gujarat', 'Junagadh', 'Not started'),
  ('Gujarat', 'Kachchh', 'Not started'), ('Gujarat', 'Kheda', 'Not started'),
  ('Gujarat', 'Mahisagar', 'Not started'), ('Gujarat', 'Mehsana', 'Not started'),
  ('Gujarat', 'Morbi', 'Not started'), ('Gujarat', 'Narmada', 'Not started'),
  ('Gujarat', 'Navsari', 'Not started'), ('Gujarat', 'Panchmahal', 'Not started'),
  ('Gujarat', 'Patan', 'Not started'), ('Gujarat', 'Porbandar', 'Not started'),
  ('Gujarat', 'Rajkot', 'Not started'), ('Gujarat', 'Sabarkantha', 'Not started'),
  ('Gujarat', 'Surat', 'Not started'), ('Gujarat', 'Surendranagar', 'Not started'),
  ('Gujarat', 'Tapi', 'Not started'), ('Gujarat', 'Vadodara', 'Not started'),
  ('Gujarat', 'Valsad', 'Not started'), ('Gujarat', 'Vav-Tharad', 'Not started')
on conflict (state, district) do nothing;

alter table public.district_coverage enable row level security;
grant select, update on public.district_coverage to anon;
drop policy if exists "anon can read district coverage" on public.district_coverage;
drop policy if exists "anon can update district coverage" on public.district_coverage;
create policy "anon can read district coverage" on public.district_coverage for select to anon using (true);
create policy "anon can update district coverage" on public.district_coverage for update to anon using (true) with check (true);
