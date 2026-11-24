-- Story 3.5: arrangøren godkjenner eller avviser, med valgfri begrunnelse.
-- MERKET UKJØRT: det finnes ingen Supabase-instans ennå. Kjør mot et eget utviklingsprosjekt og test (se Story 7.4).

-- 1) Begrunnelse ved avvisning (vises til laget). Valgfri, høyst 500 tegn.
alter table public.submissions
  add column if not exists rejection_reason text check (rejection_reason is null or length(rejection_reason) <= 500);

-- 2) Arrangøren kan bare endre status og begrunnelse, ikke notat, lag, post eller bilde.
--    (RLS-regelen submissions_update avgjør fortsatt hvem som kan oppdatere. Dette begrenser hva.)
revoke update on public.submissions from authenticated;
grant update (status, rejection_reason) on public.submissions to authenticated;

-- 3) Livsløpet: bare ventende innsendinger kan avgjøres, en avgjort innsending skrives aldri om,
--    og begrunnelsen følger bare med en avvisning.
create or replace function private.guard_submission_review() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- En avgjort innsending skrives aldri om: verken status eller begrunnelse kan endres.
  if old.status <> 'pending' and (new.status <> old.status or new.rejection_reason is distinct from old.rejection_reason) then
    raise exception 'Innsendingen er allerede avgjort' using errcode = 'check_violation';
  end if;
  if new.status <> 'rejected' then
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_guard_review on public.submissions;
create trigger submissions_guard_review before update on public.submissions
  for each row execute function private.guard_submission_review();
