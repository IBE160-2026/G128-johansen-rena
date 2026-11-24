import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { initialDemoData } from '../data/demo.js'
import { demoMode, supabase } from '../lib/supabase.js'
import { clearTripCache, isNetworkError, loadTripCache, saveTripCache } from '../lib/tripCache.js'
import { compressImage } from '../lib/image.js'
import { buildSubmissionEntry, validateNote, validationError } from '../lib/submission.js'
import { applyReview, buildReviewUpdate } from '../lib/review.js'
import { hasSubmissions } from '../lib/scoring.js'
import { changeRecord, clearDemoUser, createRecord, loadDemo, readDemoUser, writeDemoUser, loadTrip, removeRecord, resetDemo as resetDemoStore, saveDemo, uploadPhoto } from '../lib/api.js'
import { demoOwn, demoUserForRole, findTripBySlug, roleHome, standings, tripPath, validateImage } from '../lib/core.js'
import { demoImageDataUrl } from '../lib/demoImage.js'

const Context = createContext(null)
// Turdata ligger i localStorage (delt mellom faner), men rollen ligger per fane i sessionStorage.
const storage = (() => { try { return window.localStorage } catch { return null } })()
const userStorage = (() => { try { return window.sessionStorage } catch { return null } })()

const savedDemoUser = () => readDemoUser(userStorage)

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Kunne ikke lese bildet.'))
    reader.readAsDataURL(file)
  })
}

export function TripProvider({ slug, children }) {
  const [data, setData] = useState(() => demoMode ? loadDemo(storage, initialDemoData, userStorage) : null)
  const [session, setSession] = useState(null)
  const [demoUserId, setDemoUserId] = useState(savedDemoUser)
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const [cachedAt, setCachedAt] = useState(null)
  const requestRef = useRef(0)
  const dataRef = useRef(null)

  useEffect(() => { dataRef.current = data }, [data])

  const refresh = useCallback(async (userId) => {
    if (demoMode || !userId) return
    const request = ++requestRef.current // bare det nyeste svaret teller
    try {
      const next = await loadTrip(userId, slug)
      if (request !== requestRef.current) return
      setData(next)
      setOffline(false)
      setCachedAt(null)
      setError('')
      if (next) saveTripCache(storage, slug, userId, next)
      else clearTripCache(storage, slug, userId) // ikke lenger medlem
    } catch (e) {
      if (request !== requestRef.current) return
      // Tap av nett: behold det som alt er lastet, ellers vis siste lastede tur (UX-DR19). Andre feil vises som feil.
      if (isNetworkError(e, navigator.onLine)) {
        const cached = dataRef.current ? null : loadTripCache(storage, slug, userId)
        if (cached) setData(cached)
        if (cached || dataRef.current) {
          setOffline(true)
          if (cached) setCachedAt(cached.saved_at)
          setError('')
        } else setError(e.message || 'Kunne ikke hente turen.')
      } else setError(e.message || 'Kunne ikke hente turen.')
    }
  }, [slug])

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
    if (!saveDemo(storage, data)) setError('Demolagringen er full. Fjern noen bilder eller nullstill demoen.')
  }, [data])

  // Når nettet kommer tilbake, hentes turen på nytt
  useEffect(() => {
    if (demoMode || !session?.user?.id) return undefined
    const onOnline = () => refresh(session.user.id)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [session?.user?.id, refresh])

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

  const notFound = demoMode && !!data && !findTripBySlug([data.trip], slug)
  const notMember = !demoMode && !loading && !!session?.user && !data
  const path = (sub = '') => tripPath(slug, sub)
  const own = demoMode ? demoOwn(demoUserId, data?.members) : data?.own ?? null

  const userId = demoMode ? demoUserId : session?.user?.id

  // En rolle som ikke lenger passer til dataene (for eksempel etter ny seed) glemmes
  useEffect(() => {
    if (demoMode && demoUserId && data && !own) { setDemoUserId(null); clearDemoUser(userStorage) }
  }, [demoUserId, data, own])
  const isOrganizer = own?.role === 'organizer'
  const leaderboard = useMemo(() => data ? standings(data.teams, data.checkpoints, data.submissions) : [], [data])

  function demoLogin(id) {
    setDemoUserId(id)
    writeDemoUser(userStorage, id)
  }

  /** Velger demo-rolle på Start-flaten. Returnerer adressen brukeren skal sendes til. */
  function chooseRole(role) {
    const id = demoUserForRole(role, data?.members)
    if (!demoMode) return null
    if (!id) { setError('Fant ingen deltaker i prøveturen.'); return null }
    demoLogin(id)
    return roleHome(role, data.trip.slug)
  }

  /** Sletter rollen i denne fanen (Bytt rolle i demo-banneret). */
  function switchRole() {
    setDemoUserId(null)
    clearDemoUser(userStorage)
  }

  async function signOut() {
    setError('')
    if (demoMode) {
      setDemoUserId(null)
      clearDemoUser(userStorage)
    } else {
      clearTripCache(storage, slug, session?.user?.id) // mellomlageret skal ikke bli liggende på en delt enhet
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
    const { error: joinError } = await supabase.rpc('join_trip', { p_slug: slug, p_code: code, p_name: name.trim() })
    if (joinError) throw joinError
    await refresh(id)
  }

  async function organizerEmail(email) {
    const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}${tripPath(slug)}` } })
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
    if (collection === 'checkpoints' && hasSubmissions(id, data.submissions)) throw new Error('Posten har innsendinger og kan ikke slettes, fordi poengene ville forsvunnet.')
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

  async function submit(checkpointId, file, note) {
    if (!own?.team_id) throw validationError('Du må være på et lag før du kan sende inn.')
    const noteError = validateNote(note)
    if (noteError) throw validationError(noteError)
    try { validateImage(file) } catch (e) { throw validationError(e.message) }
    const existing = data.submissions.find((s) => s.team_id === own.team_id && s.checkpoint_id === checkpointId && s.status !== 'rejected')
    if (existing) throw validationError('Laget har allerede sendt inn denne posten.')
    const entry = buildSubmissionEntry({ tripId: data.trip.id, teamId: own.team_id, checkpointId, userId, note })
    if (demoMode) {
      const url = await demoImageDataUrl(file)
      const updated = { ...data, submissions: [{ ...entry, url, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...data.submissions] }
      if (!saveDemo(storage, updated)) throw new Error('Demolagringen er full. Slett noen bilder eller nullstill demoen.')
      setData(updated)
    } else {
      const blob = await compressImage(file) // maks 1600 px, JPEG (AD-11)
      const path = await uploadPhoto(data.trip.id, userId, blob)
      try { await createRecord('submissions', { ...entry, storage_path: path }) }
      catch (e) {
        try { await supabase.storage.from('trip-media').remove([path]) } catch { /* feilen fra innsettingen skal vises, ikke opprydningen */ }
        throw e
      }
      await refresh(userId)
    }
  }

  /** Arrangøren avgjør en innsending (AD-7). Samme beslutning to ganger endrer ingenting (idempotent). */
  async function review(submissionId, status, reason = null) {
    if (!isOrganizer) throw new Error('Bare arrangøren kan godkjenne eller avvise.')
    const result = applyReview(data.submissions, submissionId, status, reason)
    if (result.error) throw new Error(result.error)
    if (!result.changed) return
    if (demoMode) setData((previous) => ({ ...previous, submissions: applyReview(previous.submissions, submissionId, status, reason).submissions }))
    else {
      try { await changeRecord('submissions', submissionId, buildReviewUpdate(status, reason)) }
      finally { await refresh(userId) } // også etter feil, slik at et gammelt kort ikke blir stående
    }
  }

  async function addPhoto(file) {
    if (!userId) throw new Error('Logg inn først.')
    if (demoMode) {
      if (file.size > 450000) throw new Error('I demoen kan bilder være maks 450 KB. I live-modus komprimeres bildet automatisk.')
      const url = await fileAsDataUrl(file)
      setData((previous) => ({ ...previous, photos: [{ id: crypto.randomUUID(), trip_id: previous.trip.id, uploaded_by: userId, url, created_at: new Date().toISOString() }, ...previous.photos] }))
    } else {
      const path = await uploadPhoto(data.trip.id, userId, await compressImage(file))
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
    if (!demoMode) return
    setData(resetDemoStore(storage, initialDemoData, userStorage))
    setDemoUserId(null)
    setError('')
  }

  const value = {
    demoMode, slug, path, notFound, notMember, offline, cachedAt, data, own, userId, isOrganizer, loading, error, setError, leaderboard,
    demoLogin, chooseRole, switchRole, signOut, join, organizerEmail, write, destroy, updateTrip, submit, review,
    addPhoto, deletePhoto, resetDemo,
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTrip() {
  const context = useContext(Context)
  if (!context) throw new Error('useTrip må brukes innenfor TripProvider.')
  return context
}
