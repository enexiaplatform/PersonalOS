-- Private, provider-independent memory. No profile values belong in this public source file.
create table public.personal_os_ai_memory_sources (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 source_key text not null check(char_length(source_key) between 1 and 200), scope text not null check(scope in ('global','personal','servicebio','ventures','enexia')),
 kind text not null check(kind in ('user','notion_snapshot','year_plan','module_snapshot','ai_run')),
 title text not null check(char_length(title)<=240), source_url text, source_updated_at timestamptz,
 content_hash text not null, coverage text not null default 'unknown', checked_at timestamptz not null default now(),
 unique(owner_id,source_key), unique(owner_id,id)
);
create table public.personal_os_ai_core_memory (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 scope text not null check(scope in ('global','personal','servicebio','ventures','enexia')),
 memory_key text not null check(memory_key ~ '^[a-z0-9][a-z0-9_.:-]{2,99}$'),
 value text not null default '' check(char_length(value)<=2000), proposed_value text check(char_length(proposed_value)<=2000),
 status text not null default 'pending' check(status in ('active','pending','conflict','archived')),
 source_id uuid not null, proposed_source_id uuid,
 sensitivity text not null default 'internal' check(sensitivity in ('standard','internal','restricted')),
 external_allowed boolean not null default false check(not external_allowed or sensitivity='standard'),
 valid_until timestamptz, version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_id,scope,memory_key), foreign key(owner_id,source_id) references public.personal_os_ai_memory_sources(owner_id,id),
 foreign key(owner_id,proposed_source_id) references public.personal_os_ai_memory_sources(owner_id,id),
 check((status in ('pending','conflict') and proposed_value is not null) or status in ('active','archived'))
);
create table public.personal_os_ai_working_memory (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 scope text not null check(scope in ('personal','servicebio','ventures','enexia')),
 memory_key text not null, source_id uuid not null, source_hash text not null,
 summary jsonb not null check(jsonb_typeof(summary)='object'), expires_at timestamptz not null,
 version integer not null default 1, updated_at timestamptz not null default now(), unique(owner_id,scope,memory_key),
 foreign key(owner_id,source_id) references public.personal_os_ai_memory_sources(owner_id,id)
);
create table public.personal_os_ai_memory_events (
 id bigint generated always as identity primary key, owner_id uuid not null references auth.users(id) on delete cascade,
 scope text not null, entity_table text not null, entity_id uuid not null,
 event_type text not null, before_value jsonb, after_value jsonb, occurred_at timestamptz not null default now()
);
create index ai_memory_events_owner_scope_date on public.personal_os_ai_memory_events(owner_id,scope,occurred_at desc);
create index ai_core_memory_owner_status on public.personal_os_ai_core_memory(owner_id,status);
create index ai_working_memory_owner_expiry on public.personal_os_ai_working_memory(owner_id,expires_at);
-- Trigger function is deliberately private and not callable as a Data API RPC.
create schema if not exists personal_os_private;
revoke all on schema personal_os_private from public,anon,authenticated;
create function personal_os_private.memory_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.owner_id<>old.owner_id then raise exception 'Memory owner is immutable'; end if;
  new.version:=old.version+1; new.updated_at:=now();
 end if;
 insert into public.personal_os_ai_memory_events(owner_id,scope,entity_table,entity_id,event_type,before_value,after_value)
 values(new.owner_id,new.scope,TG_TABLE_NAME,new.id,case when TG_OP='INSERT' then 'created' else 'revised' end,case when TG_OP='UPDATE' then to_jsonb(old) end,to_jsonb(new));
 return new;
end $$;
revoke all on function personal_os_private.memory_audit() from public,anon,authenticated;
create trigger ai_core_memory_audit before insert or update on public.personal_os_ai_core_memory for each row execute function personal_os_private.memory_audit();
create trigger ai_working_memory_audit before insert or update on public.personal_os_ai_working_memory for each row execute function personal_os_private.memory_audit();
-- One atomic revision with optimistic concurrency; no elevated privileges.
create or replace function public.personal_os_memory_edit(p_id uuid,p_version integer,p_choice text,p_value text default null,p_external boolean default null)
returns public.personal_os_ai_core_memory language plpgsql security invoker set search_path='' as $$
declare r public.personal_os_ai_core_memory;
begin
 select * into r from public.personal_os_ai_core_memory where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Memory not found' using errcode='P0002'; end if;
 if r.version<>p_version then raise exception 'Memory changed; reload before editing' using errcode='40001'; end if;
 if p_choice='accept' then
  if r.proposed_value is null then raise exception 'No pending proposal'; end if;
  r.value:=r.proposed_value; r.source_id:=coalesce(r.proposed_source_id,r.source_id); r.proposed_value:=null; r.proposed_source_id:=null; r.status:='active';
 elsif p_choice='reject' then
  r.proposed_value:=null; r.proposed_source_id:=null; r.status:=case when r.value='' then 'archived' else 'active' end;
 elsif p_choice='archive' then r.status:='archived'; r.proposed_value:=null; r.proposed_source_id:=null; r.external_allowed:=false;
 elsif p_choice='edit' then
  if p_value is null or char_length(trim(p_value)) not between 3 and 2000 then raise exception 'Invalid memory value'; end if;
  r.value:=trim(p_value); r.status:='active'; r.proposed_value:=null; r.proposed_source_id:=null;
  select id into r.source_id from public.personal_os_ai_memory_sources where owner_id=auth.uid() and source_key='user:memory-editor';
  if r.source_id is null then raise exception 'User source missing'; end if;
 elsif p_choice<>'sharing' then raise exception 'Invalid choice';
 end if;
 if p_external is not null then
  if p_external and (r.sensitivity='restricted' or r.scope='servicebio') then raise exception 'Restricted memory cannot be shared'; end if;
  r.external_allowed:=p_external;
  if p_external then r.sensitivity:='standard'; end if;
 end if;
 update public.personal_os_ai_core_memory set value=r.value,proposed_value=r.proposed_value,status=r.status,source_id=r.source_id,proposed_source_id=r.proposed_source_id,external_allowed=r.external_allowed,sensitivity=r.sensitivity where id=r.id and owner_id=auth.uid() returning * into r;
 return r;
end $$;
revoke all on function public.personal_os_memory_edit(uuid,integer,text,text,boolean) from public,anon;
grant execute on function public.personal_os_memory_edit(uuid,integer,text,text,boolean) to authenticated;
alter table public.personal_os_ai_memory_sources enable row level security;
alter table public.personal_os_ai_core_memory enable row level security;
alter table public.personal_os_ai_working_memory enable row level security;
alter table public.personal_os_ai_memory_events enable row level security;
revoke all on public.personal_os_ai_memory_sources,public.personal_os_ai_core_memory,public.personal_os_ai_working_memory,public.personal_os_ai_memory_events from public,anon,authenticated;
grant select,insert,update on public.personal_os_ai_memory_sources,public.personal_os_ai_core_memory,public.personal_os_ai_working_memory to authenticated;
grant select on public.personal_os_ai_memory_events to authenticated;
do $$ declare t text; begin foreach t in array array['personal_os_ai_memory_sources','personal_os_ai_core_memory','personal_os_ai_working_memory'] loop
 execute format('create policy memory_select on public.%I for select to authenticated using(owner_id=(select auth.uid()))',t);
 execute format('create policy memory_insert on public.%I for insert to authenticated with check(owner_id=(select auth.uid()))',t);
 execute format('create policy memory_update on public.%I for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()))',t);
end loop; end $$;
create policy memory_events_select on public.personal_os_ai_memory_events for select to authenticated using(owner_id=(select auth.uid()));
alter table public.personal_os_ai_runs add column context_manifest jsonb not null default '{}'::jsonb;
comment on table public.personal_os_ai_memory_events is 'Append-only, trigger-recorded revision evidence; no authenticated INSERT/UPDATE/DELETE grants. AI output is a proposal, never a confirmed fact.';
-- Content versions catch edits even when an importer preserves the source timestamp.
create view public.personal_os_ai_week_versions with (security_invoker=true) as
 select owner_id,page_id,title,source_url,week_start,week_end,source_edited_at,synced_at,coverage,md5(items::text) content_revision from public.personal_os_notion_weeks;
create view public.personal_os_ai_year_versions with (security_invoker=true) as
 select owner_id,year,source_url,source_title,checked_at,md5(plan::text) content_revision from public.personal_os_year_plans;
revoke all on public.personal_os_ai_week_versions,public.personal_os_ai_year_versions from public,anon;
grant select on public.personal_os_ai_week_versions,public.personal_os_ai_year_versions to authenticated;
