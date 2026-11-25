-- Story 5.3: en deaktivert post tar ikke imot nye innsendinger. UKJØRT: kjøres når Supabase finnes (Story 7.4).
-- Erstatter innsettingsregelen fra 3.4. Fremmednøkkelen ON DELETE RESTRICT er uendret.
begin;
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
    and exists (
      select 1 from public.checkpoints c
      where c.id = checkpoint_id and c.trip_id = submissions.trip_id and c.status = 'active'
    )
  );

commit;
