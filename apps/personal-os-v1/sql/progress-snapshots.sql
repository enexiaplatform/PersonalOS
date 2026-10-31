-- Append-only, private checkpoint history. Ratings are assessed, not inferred from task counts.
create table public.personal_os_progress_snapshots (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 checkpoint_key text not null,
 assessment_year smallint not null check (assessment_year between 2020 and 2100),
 as_of date not null,
 rubric_version text not null,
 source_signature text not null,
 plan_signature text not null,
 reviewer text not null default 'assistant_review',
 assessment jsonb not null check (jsonb_typeof(assessment)='object'),
 supersedes_id uuid references public.personal_os_progress_snapshots(id),
 created_at timestamptz not null default now(),
 unique(owner_id,checkpoint_key),
 check (extract(year from as_of)::int=assessment_year)
);
create index personal_os_progress_owner_date on public.personal_os_progress_snapshots(owner_id,as_of desc,created_at desc);
alter table public.personal_os_progress_snapshots enable row level security;
revoke all on public.personal_os_progress_snapshots from public,anon,authenticated;
grant select on public.personal_os_progress_snapshots to authenticated;
grant select,insert on public.personal_os_progress_snapshots to service_role;
create policy progress_owner_read on public.personal_os_progress_snapshots for select to authenticated using ((select auth.uid())=owner_id);
comment on table public.personal_os_progress_snapshots is 'Private, append-only progress assessments. Missing evidence is null, not zero. Only trusted review workflows append checkpoints; browser is read-only.';
