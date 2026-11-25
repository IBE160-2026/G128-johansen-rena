-- Story 5.1: program_items får updated_at (AD-13), satt av samme trigger som checkpoints.
-- UKJØRT: kjøres mot Supabase først i Story 7.4.
alter table public.program_items
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists program_items_touch_updated_at on public.program_items;
create trigger program_items_touch_updated_at before update on public.program_items
  for each row execute function private.touch_updated_at();
