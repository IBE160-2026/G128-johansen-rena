-- Single-trip Blåtur v1. A future generator can reuse these trip-scoped tables.
-- This migration intentionally does not touch the original Blåtur database.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (length(slug) between 3 and 80),
  name text not null check (length(name) between 2 and 120),
  destination text not null default 'Hemmelig',
  description text not null default '',
  start_date date not null,
  end_date date not null,
  announcement text not null default '',
  destination_revealed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint trip_valid_dates check (end_date >= start_date)
);

-- Invitation hashes are in an unexposed schema, never in a selectable trip row.
create table private.trip_access (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  code_hash text not null
);
revoke all on private.trip_access from public, anon, authenticated;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  emoji text not null default '🏁',
  unique (trip_id, id),
  unique (trip_id, name)
);

create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 50),
  role text not null default 'participant' check (role in ('participant', 'organizer')),
  team_id uuid,
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id),
  unique (trip_id, id),
  foreign key (trip_id, team_id) references public.teams(trip_id, id) on delete set null (team_id)
);

create table public.program_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  event_date date not null,
  start_time time not null,
  title text not null check (length(title) between 1 and 120),
  description text not null default '' check (length(description) <= 1000)
);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  description text not null check (length(description) between 1 and 1000),
  points integer not null check (points between 0 and 500),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  position integer not null default 0,
  unique (trip_id, id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  team_id uuid not null,
  checkpoint_id uuid not null,
  submitted_by uuid not null references auth.users(id),
  note text not null check (length(trim(note)) between 3 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  storage_path text,
  created_at timestamptz not null default now(),
  foreign key (trip_id, team_id) references public.teams(trip_id, id),
  foreign key (trip_id, checkpoint_id) references public.checkpoints(trip_id, id)
);
create unique index submissions_one_active_per_team_checkpoint
  on public.submissions(team_id, checkpoint_id) where status in ('pending', 'approved');

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index trip_members_user_idx on public.trip_members(user_id);
create index trip_members_team_idx on public.trip_members(team_id);
create index teams_trip_idx on public.teams(trip_id);
create index program_trip_date_idx on public.program_items(trip_id, event_date, start_time);
create index checkpoints_trip_idx on public.checkpoints(trip_id, position);
create index submissions_trip_idx on public.submissions(trip_id, created_at);
create index photos_trip_idx on public.photos(trip_id, created_at);

create function private.is_member(p_trip uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.trip_members where trip_id = p_trip and user_id = (select auth.uid())) $$;

create function private.is_organizer(p_trip uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.trip_members where trip_id = p_trip and user_id = (select auth.uid()) and role = 'organizer') $$;

create function private.is_team_member(p_trip uuid, p_team uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.trip_members where trip_id = p_trip and team_id = p_team and user_id = (select auth.uid())) $$;

-- Destination is NOT granted via direct column SELECT. This RPC only reveals
-- it after publication, except for organizers who may preview it.
create function public.get_trip_destination(p_trip uuid) returns text
language sql stable security definer set search_path = public, pg_temp
as $$
  select case
    when not private.is_member(p_trip) then null
    when t.destination_revealed or private.is_organizer(p_trip) then t.destination
    else null
  end from public.trips t where t.id = p_trip
$$;
revoke all on function public.get_trip_destination(uuid) from public, anon;
grant execute on function public.get_trip_destination(uuid) to authenticated;

revoke all on function private.is_member(uuid), private.is_organizer(uuid), private.is_team_member(uuid,uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid), private.is_organizer(uuid), private.is_team_member(uuid,uuid) to authenticated;

-- Accepts a shared invite code but binds membership to the caller's real Auth ID.
create function public.join_trip(p_slug text, p_code text, p_name text) returns uuid
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare v_trip uuid; v_hash text;
begin
  if (select auth.uid()) is null then raise exception 'Logg inn først.'; end if;
  if length(trim(p_name)) not between 2 and 50 then raise exception 'Navn må være 2–50 tegn.'; end if;
  select t.id, a.code_hash into v_trip, v_hash
    from public.trips t join private.trip_access a on a.trip_id = t.id
    where t.slug = p_slug;
  if v_trip is null or v_hash is null or crypt(p_code, v_hash) is distinct from v_hash then
    raise exception 'Ugyldig invitasjonskode.';
  end if;
  insert into public.trip_members (trip_id, user_id, display_name)
    values (v_trip, (select auth.uid()), trim(p_name))
    on conflict (trip_id, user_id) do update set display_name = excluded.display_name;
  return v_trip;
end;
$$;
revoke all on function public.join_trip(text,text,text) from public, anon;
grant execute on function public.join_trip(text,text,text) to authenticated;

alter table public.trips enable row level security;
alter table public.teams enable row level security;
alter table public.trip_members enable row level security;
alter table public.program_items enable row level security;
alter table public.checkpoints enable row level security;
alter table public.submissions enable row level security;
alter table public.photos enable row level security;

create policy trips_read on public.trips for select to authenticated using ((select private.is_member(id)));
create policy trips_update on public.trips for update to authenticated using ((select private.is_organizer(id))) with check ((select private.is_organizer(id)));

create policy teams_read on public.teams for select to authenticated using ((select private.is_member(trip_id)));
create policy teams_insert on public.teams for insert to authenticated with check ((select private.is_organizer(trip_id)));
create policy teams_update on public.teams for update to authenticated using ((select private.is_organizer(trip_id))) with check ((select private.is_organizer(trip_id)));
create policy teams_delete on public.teams for delete to authenticated using ((select private.is_organizer(trip_id)));

create policy members_read on public.trip_members for select to authenticated using ((select private.is_member(trip_id)));
create policy members_update on public.trip_members for update to authenticated using ((select private.is_organizer(trip_id))) with check ((select private.is_organizer(trip_id)));

create policy program_read on public.program_items for select to authenticated using ((select private.is_member(trip_id)));
create policy program_insert on public.program_items for insert to authenticated with check ((select private.is_organizer(trip_id)));
create policy program_update on public.program_items for update to authenticated using ((select private.is_organizer(trip_id))) with check ((select private.is_organizer(trip_id)));
create policy program_delete on public.program_items for delete to authenticated using ((select private.is_organizer(trip_id)));

-- Avoid leaking the secret destination through checkpoint names or coordinates.
create policy checkpoints_read on public.checkpoints for select to authenticated
  using ((select private.is_member(trip_id)) and (
    (select private.is_organizer(trip_id)) or
    exists (select 1 from public.trips t where t.id = trip_id and t.destination_revealed)
  ));
create policy checkpoints_insert on public.checkpoints for insert to authenticated with check ((select private.is_organizer(trip_id)));
create policy checkpoints_update on public.checkpoints for update to authenticated using ((select private.is_organizer(trip_id))) with check ((select private.is_organizer(trip_id)));
create policy checkpoints_delete on public.checkpoints for delete to authenticated using ((select private.is_organizer(trip_id)));

create policy submissions_read on public.submissions for select to authenticated using ((select private.is_member(trip_id)));
create policy submissions_insert on public.submissions for insert to authenticated
  with check (submitted_by = (select auth.uid()) and status = 'pending' and (select private.is_team_member(trip_id, team_id)));
create policy submissions_update on public.submissions for update to authenticated
  using ((select private.is_organizer(trip_id))) with check ((select private.is_organizer(trip_id)));

create policy photos_read on public.photos for select to authenticated using ((select private.is_member(trip_id)));
create policy photos_insert on public.photos for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and (select private.is_member(trip_id))
    and split_part(storage_path, '/', 1) = trip_id::text
    and split_part(storage_path, '/', 2) = (select auth.uid())::text);
create policy photos_delete on public.photos for delete to authenticated
  using (uploaded_by = (select auth.uid()) or (select private.is_organizer(trip_id)));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('trip-media', 'trip-media', false, 8388608, array['image/jpeg','image/png','image/webp','image/gif','image/heic'])
on conflict (id) do nothing;

create policy trip_media_select on storage.objects for select to authenticated
  using (bucket_id = 'trip-media' and exists (
    select 1 from public.trip_members m where m.trip_id::text = split_part(name, '/', 1) and m.user_id = (select auth.uid())
  ));
create policy trip_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-media'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and exists (select 1 from public.trip_members m where m.trip_id::text = split_part(name, '/', 1) and m.user_id = (select auth.uid())));
create policy trip_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'trip-media' and (
    split_part(name, '/', 2) = (select auth.uid())::text
    or exists (select 1 from public.trip_members m where m.trip_id::text = split_part(name, '/', 1) and m.user_id = (select auth.uid()) and m.role = 'organizer')
  ));

-- Restrict privileges as well as RLS; privileged setup/seed uses the postgres role.
revoke all on public.trips, public.teams, public.trip_members, public.program_items, public.checkpoints, public.submissions, public.photos from anon;
-- Supabase grants broad default public-schema privileges; revoke the
-- authenticated table grants before adding deliberately narrow privileges.
revoke all on public.trips, public.teams, public.trip_members, public.program_items, public.checkpoints, public.submissions, public.photos from authenticated;
grant select (id, slug, name, description, start_date, end_date, announcement, destination_revealed, created_at)
  on public.trips to authenticated;
grant select on public.trip_members, public.teams, public.program_items, public.checkpoints, public.submissions, public.photos to authenticated;
grant update on public.trips, public.trip_members, public.teams, public.program_items, public.checkpoints, public.submissions to authenticated;
grant insert on public.teams, public.program_items, public.checkpoints, public.submissions, public.photos to authenticated;
grant delete on public.teams, public.program_items, public.checkpoints, public.photos to authenticated;
