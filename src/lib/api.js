import { supabase } from './supabase.js'
import { validateImage } from './core.js'

// Demo-implementasjonen (lagring av seed-turen i nettleseren) ligger i demoStore.js, men går via api.js (AD-4).
export { DEMO_DATA_KEY, DEMO_USER_KEY, loadDemo, resetDemo, saveDemo } from './demoStore.js'

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

/** Henter turen med gitt slug. Returnerer null når turen ikke finnes eller brukeren ikke er medlem (RLS). */
export async function loadTrip(userId, slug) {
  const tripRow = unwrap(await supabase.from('trips').select('id').eq('slug', slug).maybeSingle())
  if (!tripRow) return null
  const own = unwrap(await supabase.from('trip_members').select('*').eq('trip_id', tripRow.id).eq('user_id', userId).maybeSingle())
  if (!own) return null
  const tripId = tripRow.id
  const [trip, members, teams, program, checkpoints, submissions, photos] = await Promise.all([
    supabase.from('trips').select('id,slug,name,description,start_date,end_date,announcement,destination_revealed,created_at').eq('id', tripId).single(),
    supabase.from('trip_members').select('*').eq('trip_id', tripId),
    supabase.from('teams').select('*').eq('trip_id', tripId),
    supabase.from('program_items').select('*').eq('trip_id', tripId).order('event_date').order('start_time'),
    supabase.from('checkpoints').select('*').eq('trip_id', tripId).order('position'),
    supabase.from('submissions').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    supabase.from('photos').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
  ])
  const visibleDestination = unwrap(await supabase.rpc('get_trip_destination', { p_trip: tripId }))
  const result = { trip: { ...unwrap(trip), destination: visibleDestination || 'Hemmelig' }, members: unwrap(members), teams: unwrap(teams), program: unwrap(program), checkpoints: unwrap(checkpoints), submissions: unwrap(submissions), photos: unwrap(photos) }
  for (const item of [...result.photos, ...result.submissions]) {
    if (item.storage_path) {
      const signed = await supabase.storage.from('trip-media').createSignedUrl(item.storage_path, 3600)
      item.url = signed.data?.signedUrl ?? null
    }
  }
  return { ...result, own }
}

export async function uploadPhoto(tripId, userId, file) {
  validateImage(file)
  const ext = file.type.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg'
  const path = `${tripId}/${userId}/${crypto.randomUUID()}.${ext}`
  unwrap(await supabase.storage.from('trip-media').upload(path, file, { contentType: file.type, upsert: false }))
  return path
}

export async function createRecord(table, record) {
  return unwrap(await supabase.from(table).insert(record).select().single())
}

export async function changeRecord(table, id, patch) {
  const query = supabase.from(table).update(patch).eq('id', id)
  if (table === 'trips') {
    return unwrap(await query.select('id,slug,name,description,start_date,end_date,announcement,destination_revealed,created_at').single())
  }
  return unwrap(await query.select().single())
}

export async function removeRecord(table, id) {
  return unwrap(await supabase.from(table).delete().eq('id', id))
}
