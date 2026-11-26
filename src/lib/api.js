import { supabase } from './supabase.js'
import { validateImage } from './core.js'
import { applySignedUrls, pathsToSign } from './media.js'
import { generateDraft } from './generate.js'
import { publishToDemo } from './publish.js'
import { seedDraft } from '../data/demo.js'

// Demo-implementasjonen (lagring av prøveturen og publiserte turer i nettleseren) ligger i demoStore.js, men går via api.js (AD-4).
export { DEMO_DATA_KEY, DEMO_USER_KEY, clearDemoUser, dataKeyFor, listPublished, loadDemo, loadPublished, readDemoUser, resetDemo, resetTexts, saveDemo, writeDemoUser } from './demoStore.js'
export { canPublish } from './publish.js'

const cryptoRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

/** Publiserer utkastet i demo (Story 2.7; live venter på Supabase og Story 2.1). Utkastet røres ikke. */
export function publishDraft(storage, draft, request, now = new Date()) {
  return publishToDemo(storage, draft, request, { random: cryptoRandom, now })
}

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
  const items = [...result.photos, ...result.submissions]
  const paths = pathsToSign(items, tripId)
  let signed = []
  if (paths.length) {
    try {
      const res = await supabase.storage.from('trip-media').createSignedUrls(paths, 3600)
      if (res.error) console.warn('Kunne ikke signere bilde-URL-er', res.error)
      signed = res.error ? [] : res.data
    } catch (e) { console.warn('Kunne ikke signere bilde-URL-er', e); signed = [] }
  }
  result.photos = applySignedUrls(result.photos, signed)
  result.submissions = applySignedUrls(result.submissions, signed)
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

export { GENERATE_STEPS } from './generate.js'

/** Lager et utkast fra en TripRequest (demo, Story 2.3; live kommer i 2.4). Se `generateDraft` i generate.js. */
export function generateTrip(req, options) {
  return generateDraft(req, seedDraft, options)
}
