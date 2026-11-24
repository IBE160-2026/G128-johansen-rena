-- Replace text-only rebus answers with required photo evidence.
-- Keep legacy text answers readable/reviewable, but require images on NEW rows.
alter table public.submissions alter column note drop not null;
alter table public.submissions drop constraint if exists submissions_note_check;
alter table public.submissions add constraint submissions_note_length
  check (note is null or length(note) <= 1000);

drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and status = 'pending'
    and (select private.is_team_member(trip_id, team_id))
    and storage_path is not null
    and split_part(storage_path, '/', 1) = trip_id::text
    and split_part(storage_path, '/', 2) = (select auth.uid())::text
  );

-- An additional modern iPhone format accepted by the upload client.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
where id = 'trip-media';
