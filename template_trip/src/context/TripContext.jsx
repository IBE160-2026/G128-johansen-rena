import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { initialDemoData } from '../data/demo.js'
import { demoMode, supabase } from '../lib/supabase.js'
import { changeRecord, createRecord, loadTrip, removeRecord, uploadPhoto } from '../lib/api.js'
import { standings, validateImage } from '../lib/core.js'
import { demoImageDataUrl } from '../lib/demoImage.js'

const Context = createContext(null)
const DEMO_DATA_KEY = 'blatur-ren-demo-v1'
const DEMO_USER_KEY = 'blatur-ren-user-v1'

function savedDemo() {
  try {
    const item = JSON.parse(localStorage.getItem(DEMO_DATA_KEY))
    if (item?.trip && Array.isArray(item?.teams) && Array.isArray(item?.program)) return item
  } catch { /* ignore corrupt local demo data */ }
  return initialDemoData()
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Kunne ikke lese bildet.'))
    reader.readAsDataURL(file)
  })
}

export function TripProvider({ children }) {
  const [data, setData] = useState(() => demoMode ? savedDemo() : null)
  const [session, setSession] = useState(null)
  const [demoUserId, setDemoUserId] = useState(() => localStorage.getItem(DEMO_USER_KEY))
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState('')

  const refresh = useCallback(async (userId) => {
    if (demoMode || !userId) return
    try {
      const next = await loadTrip(userId)
      setData(next)
      setError('')
    } catch (e) {
      setError(e.message || 'Kunne ikke hente turen.')
    }
  }, [])

  useEffect(() => {
    if (demoMode) return undefined
    let active = true
    supabase.auth.getSession().then(({ data: result, error: authError }) => {
      if (!active) return
      setSession(result.session)
      if (authError) setError(authError.message)
      if (result.session?.user) refresh(result.session.user.id).finally(() => active && setLoading(false))
      else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      if (next?.user) setTimeout(() => refresh(next.user.id), 0)
      else setData(null)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [refresh])

  useEffect(() => {
    if (!demoMode || !data) return
    try { localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data)) }
    catch { setError('Demolagringen er full. Fjern noen bilder eller nullstill demoen.') }
  }, [data])

  useEffect(() => {
    if (demoMode || !data?.trip?.id || !session?.user?.id) return undefined
    const id = data.trip.id
    const channel = supabase.channel(`trip-${id}`)
    for (const table of ['trip_members', 'teams', 'program_items', 'checkpoints', 'submissions', 'photos']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `trip_id=eq.${id}` }, () => refresh(session.user.id))
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${id}` }, () => refresh(session.user.id))
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [data?.trip?.id, session?.user?.id, refresh])

  const own = demoMode
    ? demoUserId === 'demo-admin'
      ? { id: 'demo-admin', user_id: 'demo-admin', display_name: 'Arrangør', role: 'organizer', team_id: null }
      : data?.members.find((m) => m.user_id === demoUserId) ?? null
    : data?.own ?? null

  const userId = demoMode ? demoUserId : session?.user?.id
  const isOrganizer = own?.role === 'organizer'
  const leaderboard = useMemo(() => data ? standings(data.teams, data.checkpoints, data.submissions) : [], [data])

  function demoLogin(id) {
    setDemoUserId(id)
    localStorage.setItem(DEMO_USER_KEY, id)
  }

  async function signOut() {
    setError('')
    if (demoMode) {
      setDemoUserId(null)
      localStorage.removeItem(DEMO_USER_KEY)
    } else {
      const { error: signoutError } = await supabase.auth.signOut()
      if (signoutError) throw signoutError
      setSession(null)
      setData(null)
    }
  }

  async function join(name, code) {
    if (!name.trim() || !code.trim()) throw new Error('Fyll inn navn og invitasjonskode.')
    let id = session?.user?.id
    if (!id) {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError
      id = authData.user.id
    }
    const { error: joinError } = await supabase.rpc('join_trip', { p_slug: 'blatur-2026', p_code: code, p_name: name.trim() })
    if (joinError) throw joinError
    await refresh(id)
  }

  async function organizerEmail(email) {
    const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (otpError) throw otpError
  }

  async function write(collection, record, id = null) {
    if (!isOrganizer) throw new Error('Bare arrangører kan endre dette.')
    const table = collection === 'program' ? 'program_items' : collection === 'members' ? 'trip_members' : collection
    if (demoMode) {
      const newItem = id ? { ...data[collection].find((item) => item.id === id), ...record } : { ...record, id: crypto.randomUUID(), trip_id: data.trip.id }
      setData((previous) => ({
        ...previous,
        [collection]: id ? previous[collection].map((item) => item.id === id ? newItem : item) : [...previous[collection], newItem],
      }))
      return newItem
    }
    const item = id ? await changeRecord(table, id, record) : await createRecord(table, { ...record, trip_id: data.trip.id })
    await refresh(userId)
    return item
  }

  async function destroy(collection, id) {
    if (!isOrganizer) throw new Error('Bare arrangører kan slette dette.')
    if (demoMode) setData((previous) => ({ ...previous, [collection]: previous[collection].filter((item) => item.id !== id) }))
    else {
      await removeRecord(collection === 'program' ? 'program_items' : collection === 'members' ? 'trip_members' : collection, id)
      await refresh(userId)
    }
  }

  async function updateTrip(patch) {
    if (!isOrganizer) throw new Error('Bare arrangører kan endre turen.')
    if (demoMode) setData((previous) => ({ ...previous, trip: { ...previous.trip, ...patch } }))
    else { await changeRecord('trips', data.trip.id, patch); await refresh(userId) }
  }

  async function submit(checkpointId, file) {
    if (!own?.team_id) throw new Error('Du må være på et lag før du kan sende inn.')
    validateImage(file)
    const existing = data.submissions.find((s) => s.team_id === own.team_id && s.checkpoint_id === checkpointId && s.status !== 'rejected')
    if (existing) throw new Error('Laget har allerede sendt inn denne posten.')
    const entry = { trip_id: data.trip.id, team_id: own.team_id, checkpoint_id: checkpointId, submitted_by: userId, status: 'pending' }
    if (demoMode) {
      const url = await demoImageDataUrl(file)
      const updated = { ...data, submissions: [{ ...entry, url, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...data.submissions] }
      try { localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(updated)) }
      catch { throw new Error('Demolagringen er full. Slett noen bilder eller nullstill demoen.') }
      setData(updated)
    } else {
      const path = await uploadPhoto(data.trip.id, userId, file)
      try { await createRecord('submissions', { ...entry, storage_path: path }) }
      catch (e) { await supabase.storage.from('trip-media').remove([path]); throw e }
      await refresh(userId)
    }
  }

  async function review(submissionId, status) {
    if (!isOrganizer || !['approved', 'rejected'].includes(status)) throw new Error('Ugyldig handling.')
    if (demoMode) setData((previous) => ({ ...previous, submissions: previous.submissions.map((s) => s.id === submissionId ? { ...s, status } : s) }))
    else { await changeRecord('submissions', submissionId, { status }); await refresh(userId) }
  }

  async function addPhoto(file) {
    if (!userId) throw new Error('Logg inn først.')
    if (demoMode) {
      if (file.size > 450000) throw new Error('I demoen kan bilder være maks 450 KB. Produksjonsmodus støtter 8 MB.')
      const url = await fileAsDataUrl(file)
      setData((previous) => ({ ...previous, photos: [{ id: crypto.randomUUID(), trip_id: previous.trip.id, uploaded_by: userId, url, created_at: new Date().toISOString() }, ...previous.photos] }))
    } else {
      const path = await uploadPhoto(data.trip.id, userId, file)
      try { await createRecord('photos', { trip_id: data.trip.id, uploaded_by: userId, storage_path: path }) }
      catch (e) { await supabase.storage.from('trip-media').remove([path]); throw e }
      await refresh(userId)
    }
  }

  async function deletePhoto(photo) {
    if (!isOrganizer && photo.uploaded_by !== userId) throw new Error('Du kan bare slette egne bilder.')
    if (demoMode) setData((previous) => ({ ...previous, photos: previous.photos.filter((p) => p.id !== photo.id) }))
    else {
      await removeRecord('photos', photo.id)
      if (photo.storage_path) await supabase.storage.from('trip-media').remove([photo.storage_path])
      await refresh(userId)
    }
  }

  function resetDemo() {
    if (!demoMode || !isOrganizer) return
    setData(initialDemoData())
    setError('')
  }

  const value = {
    demoMode, data, own, userId, isOrganizer, loading, error, setError, leaderboard,
    demoLogin, signOut, join, organizerEmail, write, destroy, updateTrip, submit, review,
    addPhoto, deletePhoto, resetDemo,
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTrip() {
  const context = useContext(Context)
  if (!context) throw new Error('useTrip må brukes innenfor TripProvider.')
  return context
}
