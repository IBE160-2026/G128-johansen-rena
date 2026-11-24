-- Story 3.6: poeng avledes fra godkjente innsendinger (AD-5).
-- MERKET UKJØRT: det finnes ingen Supabase-instans ennå. Kjør mot et eget utviklingsprosjekt og test (se Story 7.4).
-- Regelen skal gi samme svar som src/lib/scoring.js på tests/fixtures/scoring-cases.json.
-- Tilfeller merket "jsOnly" finnes bare i JavaScript, fordi databasen ikke kan inneholde dem
-- (dobbelt godkjent, ukjent post eller lag, ugyldige poeng). De øvrige skal kjøres mot viewet i Story 7.4.

-- 1) Databasen tillater ikke to godkjente innsendinger for samme lag og post.
--    Den eksisterende indeksen submissions_one_active_per_team_checkpoint (ventende og godkjente) dekker det allerede,
--    så denne er en eksplisitt, billig gjentakelse av regelen og kan ikke feile på eksisterende data.
create unique index if not exists submissions_one_approved_per_team_checkpoint
  on public.submissions (team_id, checkpoint_id)
  where status = 'approved';

-- 2) team_scores: lagets poeng er summen av postens gjeldende poeng for poster med en godkjent innsending.
--    Ingen kolonne for poeng per lag eller innsending. Endres postens poeng, endres summen for alle som har løst den.
--    Ventende og avviste teller ikke, deaktiverte poster teller fortsatt, og hver post teller én gang per lag.
--    security_invoker gjør at RLS på teams, submissions og checkpoints gjelder for den som leser, så en deltaker bare ser egen tur.
create or replace view public.team_scores
with (security_invoker = true) as
select
  t.trip_id,
  t.id as team_id,
  t.name,
  t.emoji,
  coalesce(sum(greatest(c.points, 0)), 0)::integer as points,
  count(c.id)::integer as completed
from public.teams t
left join (
  select distinct s.trip_id, s.team_id, s.checkpoint_id
  from public.submissions s
  where s.status = 'approved'
) done on done.team_id = t.id and done.trip_id = t.trip_id
left join public.checkpoints c on c.id = done.checkpoint_id and c.trip_id = done.trip_id
group by t.trip_id, t.id, t.name, t.emoji;

-- 3) Bare innloggede kan lese (ikke anon).
revoke all on public.team_scores from anon, public;
grant select on public.team_scores to authenticated;
