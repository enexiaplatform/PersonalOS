create table public.personal_os_notion_weeks (
 owner_id uuid not null references auth.users(id) on delete cascade,
 page_id text not null,
 title text not null,
 source_url text not null check (source_url ~ '^https://(app\.)?notion\.(com|so)/'),
 week_start date not null,
 week_end date not null check (week_end >= week_start and week_end-week_start<=7),
 source_edited_at timestamptz,
 synced_at timestamptz not null default now(),
 coverage text not null default 'page_only' check (coverage in ('page_only','partial','complete','conflict')),
 summary text not null default '',
 items jsonb not null default '[]'::jsonb check (jsonb_typeof(items)='array'),
 warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings)='array'),
 primary key(owner_id,page_id)
);
create index personal_os_notion_weeks_period on public.personal_os_notion_weeks(owner_id,week_start desc);
alter table public.personal_os_notion_weeks enable row level security;
revoke all on public.personal_os_notion_weeks from anon,authenticated;
grant select on public.personal_os_notion_weeks to authenticated;
grant all on public.personal_os_notion_weeks to service_role;
create policy notion_weeks_owner_read on public.personal_os_notion_weeks for select to authenticated using ((select auth.uid())=owner_id);
comment on table public.personal_os_notion_weeks is 'Read-only Notion imports. Each item: key,pillar,status(plan|reported_done|blocked|unknown),text,context,source_url,occurred_on optional. Source assertions are not verified KR attainment. Use owner_id,page_id upsert; replace snapshots; never add totals across repeated mentions.';