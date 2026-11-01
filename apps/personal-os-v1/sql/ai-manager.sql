-- Personal OS AI Manager Level B. Applied to existing Supabase project; preserve owner RLS.
create table if not exists public.personal_os_ai_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  task_id text not null,
  question text not null check (char_length(question) between 4 and 1600),
  scope text not null default 'personal' check(scope in ('personal','servicebio','ventures','enexia')),
  status text not null default 'running' check(status in ('running','stopped','waiting','error')),
  summary jsonb not null default '{}'::jsonb,
  task_url text,
  last_error text,
  source_week date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,task_id)
);
create table if not exists public.personal_os_ai_actions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  action_key text not null check(char_length(action_key) between 5 and 180),
  run_id uuid references public.personal_os_ai_runs(id) on delete set null,
  scope text not null default 'personal' check(scope in ('personal','servicebio','ventures','enexia')),
  title text not null check(char_length(title) between 3 and 200),
  detail text not null default '' check(char_length(detail)<=1600),
  evidence text not null default '' check(char_length(evidence)<=1000),
  priority text not null default 'medium' check(priority in ('high','medium','low')),
  operation text not null default 'review_only' check(operation in ('review_only','save_review_note')),
  requires_approval boolean not null default true,
  source_week date,
  status text not null default 'proposed' check(status in ('proposed','approved','executed','dismissed','blocked')),
  executed_ref uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  unique(owner_id,action_key)
);
create table if not exists public.personal_os_ai_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  action_id uuid references public.personal_os_ai_actions(id) on delete set null,
  event_type text not null check(char_length(event_type) between 3 and 60),
  detail jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists personal_os_ai_actions_owner_status_idx on public.personal_os_ai_actions(owner_id,status,created_at desc);
create index if not exists personal_os_ai_runs_owner_date_idx on public.personal_os_ai_runs(owner_id,created_at desc);
create index if not exists personal_os_ai_events_owner_date_idx on public.personal_os_ai_events(owner_id,occurred_at desc);
alter table public.personal_os_ai_runs enable row level security;
alter table public.personal_os_ai_actions enable row level security;
alter table public.personal_os_ai_events enable row level security;
revoke all on public.personal_os_ai_runs,public.personal_os_ai_actions,public.personal_os_ai_events from anon,authenticated;
grant select,insert,update on public.personal_os_ai_runs,public.personal_os_ai_actions to authenticated;
grant select,insert on public.personal_os_ai_events to authenticated;
grant usage,select on sequence public.personal_os_ai_events_id_seq to authenticated;
create policy ai_runs_select on public.personal_os_ai_runs for select to authenticated using(owner_id=(select auth.uid()));
create policy ai_runs_insert on public.personal_os_ai_runs for insert to authenticated with check(owner_id=(select auth.uid()));
create policy ai_runs_update on public.personal_os_ai_runs for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy ai_actions_select on public.personal_os_ai_actions for select to authenticated using(owner_id=(select auth.uid()));
create policy ai_actions_insert on public.personal_os_ai_actions for insert to authenticated with check(owner_id=(select auth.uid()));
create policy ai_actions_update on public.personal_os_ai_actions for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy ai_events_select on public.personal_os_ai_events for select to authenticated using(owner_id=(select auth.uid()));
create policy ai_events_insert on public.personal_os_ai_events for insert to authenticated with check(owner_id=(select auth.uid()));
