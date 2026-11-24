// Demo data, separate from the original production database.
const tripId = 'demo-trip'
const names = ['Knoll', 'Kevin', 'Stian', 'Elias', 'Eskil', 'Kenneth', 'Håvar', 'Eirik', 'Jørgen', 'Pinna']
const teamA = 'demo-team-a'
const teamB = 'demo-team-b'

const itinerary = [
  ['2026-04-24', '07:20', 'Oppmøte Gardermoen ✈️', 'Møt opp i god tid før avgang'],
  ['2026-04-24', '10:00', 'Avreise og ankomst', 'Eventyret starter'],
  ['2026-04-24', '18:00', 'Felles samling', 'Første kveld sammen'],
  ['2026-04-25', '09:00', 'Frokost 🍳', 'Start dagen med mat i magen'],
  ['2026-04-25', '11:00', 'Rebus starter 🗺️', 'Finn laget og gjør dere klare'],
  ['2026-04-25', '14:00', 'Lunsj', 'En velfortjent pause'],
  ['2026-04-25', '17:00', 'Elvecruise 🛥️', 'Cruise på elven'],
  ['2026-04-25', '20:00', 'Gallamiddag 🌟', 'Middag og premieutdeling'],
  ['2026-04-26', '09:00', 'Frokost 🍳', 'Rolig start på dagen'],
  ['2026-04-26', '12:00', 'Byvandring 🏛️', 'Utforsk byen sammen'],
  ['2026-04-26', '19:00', 'Middag 🍽️', 'Siste kveld'],
  ['2026-04-27', '09:00', 'Frokost og utsjekk ☕', 'Pakk og gjør klart'],
  ['2026-04-27', '14:00', 'Mot flyplassen 🛫', 'Takk for turen!'],
]

const tasks = [
  ['Palasset', 'Syng Ja vi elsker sammen som lag', 10, 47.4969, 19.0398],
  ['Donau', 'Ta et kreativt lagbilde ved elven', 15, 47.4983, 19.0453],
  ['Széchenyi-badet', 'Ta et morsomt gruppebilde utenfor badet', 15, 47.5188, 19.0802],
  ['Ruinbar', 'Finn et morsomt skilt og ta et lagbilde', 10, 47.4985, 19.0654],
  ['Broen', 'Lag en menneskepyramide eller et kreativt alternativ', 20, 47.4979, 19.0450],
  ['Markedet', 'Finn noe nytt og ta et bilde av det', 10, 47.4866, 19.0575],
]

export function initialDemoData() {
  return {
    trip: {
      id: tripId, slug: 'blatur-2026', name: 'Blåtur 2026', destination: 'Budapest',
      description: 'Fire dager, ti kompiser og én uforglemmelig tur.',
      start_date: '2026-04-24', end_date: '2026-04-27', announcement: 'Velkommen til Blåtur! 🎉',
      destination_revealed: true,
    },
    teams: [
      { id: teamA, trip_id: tripId, name: 'Ungæærn', emoji: '🦁' },
      { id: teamB, trip_id: tripId, name: 'BudaBreast', emoji: '🐯' },
    ],
    members: names.map((name, i) => ({
      id: `demo-member-${i}`, trip_id: tripId, user_id: `demo-user-${i}`,
      display_name: name, role: 'participant', team_id: i % 2 === 0 ? teamA : teamB,
    })),
    program: itinerary.map(([event_date, start_time, title, description], i) => ({
      id: `demo-event-${i}`, trip_id: tripId, event_date, start_time, title, description,
    })),
    checkpoints: tasks.map(([title, description, points, latitude, longitude], i) => ({
      id: `demo-checkpoint-${i}`, trip_id: tripId, title, description, points,
      latitude, longitude, position: i + 1,
    })),
    submissions: [],
    photos: [],
  }
}
