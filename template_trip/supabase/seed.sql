-- LOCAL DEMO ONLY. Do not run this seed on an existing production project.
-- Invite code for the local seed: demo-2026
set search_path = public, extensions;
insert into public.trips (id, slug, name, destination, description, start_date, end_date, announcement, destination_revealed)
values ('00000000-0000-4000-8000-000000000001', 'blatur-2026', 'Blåtur 2026', 'Budapest',
  'Fire dager, ti kompiser og én uforglemmelig tur.', '2026-04-24', '2026-04-27', 'Velkommen til Blåtur! 🎉', true)
on conflict (id) do nothing;

insert into private.trip_access(trip_id, code_hash)
values ('00000000-0000-4000-8000-000000000001', crypt('demo-2026', gen_salt('bf')))
on conflict (trip_id) do nothing;

insert into public.teams (id, trip_id, name, emoji)
values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Ungæærn', '🦁'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'BudaBreast', '🐯')
on conflict (id) do nothing;

insert into public.program_items(trip_id, event_date, start_time, title, description)
values
  ('00000000-0000-4000-8000-000000000001', '2026-04-24', '07:20', 'Oppmøte Gardermoen ✈️', 'Møt opp i god tid før avgang'),
  ('00000000-0000-4000-8000-000000000001', '2026-04-24', '10:00', 'Avreise og ankomst', 'Eventyret starter'),
  ('00000000-0000-4000-8000-000000000001', '2026-04-25', '09:00', 'Frokost 🍳', 'Start dagen med mat i magen'),
  ('00000000-0000-4000-8000-000000000001', '2026-04-25', '11:00', 'Rebus starter 🗺️', 'Finn laget og gjør dere klare'),
  ('00000000-0000-4000-8000-000000000001', '2026-04-25', '17:00', 'Elvecruise 🛥️', 'Cruise på elven'),
  ('00000000-0000-4000-8000-000000000001', '2026-04-25', '20:00', 'Gallamiddag 🌟', 'Middag og premieutdeling'),
  ('00000000-0000-4000-8000-000000000001', '2026-04-26', '12:00', 'Byvandring 🏛️', 'Utforsk byen sammen'),
  ('00000000-0000-4000-8000-000000000001', '2026-04-27', '14:00', 'Mot flyplassen 🛫', 'Takk for turen!');

insert into public.checkpoints(trip_id, title, description, points, latitude, longitude, position)
values
  ('00000000-0000-4000-8000-000000000001', 'Palasset', 'Syng Ja vi elsker sammen som lag', 10, 47.4969, 19.0398, 1),
  ('00000000-0000-4000-8000-000000000001', 'Donau', 'Ta et kreativt lagbilde ved elven', 15, 47.4983, 19.0453, 2),
  ('00000000-0000-4000-8000-000000000001', 'Széchenyi-badet', 'Ta et morsomt gruppebilde utenfor badet', 15, 47.5188, 19.0802, 3),
  ('00000000-0000-4000-8000-000000000001', 'Ruinbar', 'Finn et morsomt skilt og ta et lagbilde', 10, 47.4985, 19.0654, 4),
  ('00000000-0000-4000-8000-000000000001', 'Broen', 'Lag en menneskepyramide eller et kreativt alternativ', 20, 47.4979, 19.0450, 5),
  ('00000000-0000-4000-8000-000000000001', 'Markedet', 'Finn noe nytt og ta et bilde av det', 10, 47.4866, 19.0575, 6);
