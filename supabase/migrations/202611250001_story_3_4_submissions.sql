-- Story 3.4: bilde og notat som svar, og kolonner appen trenger på poster.
-- MERKET UKJØRT: det finnes ingen Supabase-instans ennå. Kjør mot et eget utviklingsprosjekt og test (se Story 7.4).

-- 1) Poster: opplåsing ved posisjon (AD-6) og deaktivering (AD-13).
--    Eksisterende poster blir åpne (requires_location = false), slik de var i malen.
alter table public.checkpoints
  add column if not exists requires_location boolean not null default false,
  add column if not exists radius_m integer not null default 50 check (radius_m > 0),
  add column if not exists status text not null default 'active' check (status in ('active', 'deactivated')),
  add column if not exists updated_at timestamptz not null default now();

create or replace function private.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists checkpoints_touch_updated_at on public.checkpoints;
create trigger checkpoints_touch_updated_at before update on public.checkpoints
  for each row execute function private.touch_updated_at();

-- 2) Innsendinger: en post med innsendinger kan ikke slettes (AD-13). Gjør ON DELETE RESTRICT eksplisitt.
do $$
declare
  existing text;
begin
  select conname into existing
  from pg_constraint
  where conrelid = 'public.submissions'::regclass
    and contype = 'f'
    and confrelid = 'public.checkpoints'::regclass;
  if existing is not null then
    execute format('alter table public.submissions drop constraint %I', existing);
  end if;
  alter table public.submissions
    add constraint submissions_checkpoint_restrict
    foreign key (trip_id, checkpoint_id) references public.checkpoints (trip_id, id) on delete restrict;
end
$$;

-- 3) Nye innsendinger krever bilde og et notat på 3 til 1000 tegn, og kan bare opprettes som ventende for eget lag.
--    (Eldre rader uten notat berøres ikke, siden regelen ligger i innsettingsregelen og ikke i en CHECK.)
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and status = 'pending'
    and (select private.is_team_member(trip_id, team_id))
    and note is not null
    and length(trim(note)) between 3 and 1000
    and storage_path is not null
    and split_part(storage_path, '/', 1) = trip_id::text
    and split_part(storage_path, '/', 2) = (select auth.uid())::text
  );

-- 4) Bucketen tar bare imot JPEG, PNG og WebP (klienten komprimerer til JPEG, maks 1600 px).
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'trip-media';
