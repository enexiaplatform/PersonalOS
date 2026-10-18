create table public.personal_os_year_plans(owner_id uuid not null references auth.users(id) on delete cascade,year smallint not null check(year between 2020 and 2100),source_url text not null,source_title text not null,checked_at timestamptz not null default now(),plan jsonb not null,primary key(owner_id,year));
alter table public.personal_os_year_plans enable row level security;
revoke all on public.personal_os_year_plans from anon,authenticated;
grant select on public.personal_os_year_plans to authenticated;
grant all on public.personal_os_year_plans to service_role;
create policy year_plan_owner_read on public.personal_os_year_plans for select to authenticated using ((select auth.uid())=owner_id);
