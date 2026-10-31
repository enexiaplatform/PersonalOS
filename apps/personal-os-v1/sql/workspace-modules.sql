-- Private module replicas and protected UI packages; original source sites remain the writers.
create schema if not exists personal_os_private;
revoke all on schema personal_os_private from public,anon,authenticated;
create table personal_os_private.module_publishers(module text primary key check(module in ('servicebio','ventures')),owner_id uuid not null references auth.users(id) on delete cascade,token_hash text not null check(token_hash ~ '^[a-f0-9]{64}$'),enabled boolean not null default true);
revoke all on personal_os_private.module_publishers from public,anon,authenticated;
create table public.personal_os_module_snapshots(owner_id uuid not null references auth.users(id) on delete cascade,module text not null check(module in ('servicebio','ventures')),payload jsonb not null,revision_hash text not null,source_updated_at timestamptz not null,mirrored_at timestamptz not null default now(),primary key(owner_id,module));
create table public.personal_os_module_assets(owner_id uuid not null references auth.users(id) on delete cascade,module text not null check(module in ('servicebio','ventures')),content_gzip_base64 text not null,source_commit text not null,asset_hash text not null,updated_at timestamptz not null default now(),primary key(owner_id,module));
alter table public.personal_os_module_snapshots enable row level security;
alter table public.personal_os_module_assets enable row level security;
revoke all on public.personal_os_module_snapshots,public.personal_os_module_assets from public,anon,authenticated;
grant select on public.personal_os_module_snapshots,public.personal_os_module_assets to authenticated;
grant all on public.personal_os_module_snapshots,public.personal_os_module_assets to service_role;
create policy module_snapshot_owner on public.personal_os_module_snapshots for select to authenticated using((select auth.uid())=owner_id);
create policy module_asset_owner on public.personal_os_module_assets for select to authenticated using((select auth.uid())=owner_id);
create or replace function public.publish_personal_os_module(p_module text,p_token text,p_payload jsonb,p_source_at timestamptz) returns jsonb language plpgsql security definer set search_path='' as $function$
declare publisher_owner uuid; new_hash text; existing public.personal_os_module_snapshots%rowtype; changed int;
begin
 if p_token is null or length(p_token)<40 or p_module not in ('servicebio','ventures') then raise exception 'Invalid publisher'; end if;
 select owner_id into publisher_owner from personal_os_private.module_publishers where module=p_module and enabled and token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 if publisher_owner is null then raise exception 'Invalid publisher'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>3000000 or p_source_at is null or p_source_at>now()+interval '15 minutes' then raise exception 'Invalid module snapshot'; end if;
 if p_module='servicebio' and (jsonb_typeof(p_payload->'data') is distinct from 'object' or jsonb_typeof(p_payload->'data'->'materials') is distinct from 'array' or jsonb_typeof(p_payload->'data'->'workstreams') is distinct from 'array') then raise exception 'Invalid Servicebio snapshot'; end if;
 if p_module='ventures' and (jsonb_typeof(p_payload->'projects') is distinct from 'array' or jsonb_array_length(p_payload->'projects')<3 or jsonb_array_length(p_payload->'projects')>4 or jsonb_typeof(p_payload->'sources') is distinct from 'array') then raise exception 'Invalid Ventures snapshot'; end if;
 new_hash=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 select * into existing from public.personal_os_module_snapshots where owner_id=publisher_owner and module=p_module;
 if existing.revision_hash=new_hash then return jsonb_build_object('status','unchanged'); end if;
 if existing.source_updated_at>p_source_at then return jsonb_build_object('status','older_ignored'); end if;
 insert into public.personal_os_module_snapshots(owner_id,module,payload,revision_hash,source_updated_at,mirrored_at) values(publisher_owner,p_module,p_payload,new_hash,p_source_at,now()) on conflict(owner_id,module) do update set payload=excluded.payload,revision_hash=excluded.revision_hash,source_updated_at=excluded.source_updated_at,mirrored_at=excluded.mirrored_at where excluded.source_updated_at>=personal_os_module_snapshots.source_updated_at;
 get diagnostics changed=row_count;
 return jsonb_build_object('status',case when changed=1 then 'mirrored' else 'older_ignored' end);
end $function$;
revoke all on function public.publish_personal_os_module(text,text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.publish_personal_os_module(text,text,jsonb,timestamptz) to anon,authenticated,service_role;
comment on function public.publish_personal_os_module(text,text,jsonb,timestamptz) is 'Capability-protected publisher. A random per-module token binds owner and destination; no payload is ever returned. Browser code never contains publisher tokens.';
