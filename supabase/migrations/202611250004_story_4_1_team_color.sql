-- Story 4.1: lagfarge. Hvert lag får et fargetoken (team-1 til team-6) som appen viser som aksent sammen med navn og emoji.
-- MERKET UKJØRT: det finnes ingen Supabase-instans ennå. Kjør mot et eget utviklingsprosjekt og test (se Story 7.4).

alter table public.teams
  add column if not exists color text check (color is null or color in ('team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6'));

-- Fyll inn eksisterende lag i rekkefølge per tur (første lag får team-1 osv.). Flere enn seks lag gjenbruker farger.
update public.teams t
set color = 'team-' || (((numbered.rn - 1) % 6) + 1)
from (
  select id, row_number() over (partition by trip_id order by name, id) as rn
  from public.teams
) numbered
where t.id = numbered.id and t.color is null;
