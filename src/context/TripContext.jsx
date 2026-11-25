import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { initialDemoData } from '../data/demo.js'
import { demoMode, supabase } from '../lib/supabase.js'
import { clearTripCache, isNetworkError, loadTripCache, saveTripCache } from '../lib/tripCache.js'
import { compressImage } from '../lib/image.js'
import { buildSubmissionEntry, validateNote, validationError } from '../lib/submission.js'
import { applyReview, buildReviewUpdate } from '../lib/review.js'
import { changedItems, isChanged as isItemChanged, loadSeen, markAllSeen as markAllItemsSeen, markSeen as markItemSeen, mergeSeen, readSeen, saveSeen } from '../lib/changes.js'
import { hasSubmissions } from '../lib/scoring.js'
import { moveMember as applyMove } from '../lib/teams.js'
import { CHANNEL_NAME, isRelevant, makeMessage, shouldRefreshNow } from '../lib/signal.js'
import { changeRecord, clearDemoUser, createRecord, loadDemo, readDemoUser, writeDemoUser, loadTrip, removeRecord, resetDemo as resetDemoStore, saveDemo, uploadPhoto } from '../lib/api.js'
import { acceptsSubmissions, demoOwn, demoUserForRole, findTripBySlug, roleHome, standings, tripPath, validateImage } from '../lib/core.js'
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
  const channelRef = useRef(null)
  const senderRef = useRef(null)
  const lastFetchRef = useRef(null)
  // Data som ikke er en lokal endring (første innlasting og data lest på nytt etter signal): lagres ikke og gir ikke signal.
  const receivedRef = useRef(data)
  if (!senderRef.current) senderRef.current = globalThis.crypto?.randomUUID?.() ?? `fane-${Math.random().toString(36).slice(2)}` // randomUUID finnes ikke over http på LAN-IP

  useEffect(() => { dataRef.current = data }, [data])

  /** Leser demodata fra lagring uten å lagre eller sende signal på nytt. */
  const readDemoAgain = useCallback(() => {
    let next = null
    try { next = loadDemo(storage, initialDemoData, userStorage) } catch { /* ødelagt lagring: behold det som vises */ }
    if (!next?.trip) return
    receivedRef.current = next
    setData(next)
  }, [])

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
    if (data === receivedRef.current) return // lest på nytt, ikke en lokal endring
    if (!saveDemo(storage, data)) { setError('Demolagringen er full. Fjern noen bilder eller nullstill demoen.'); return }
    try { channelRef.current?.postMessage(makeMessage(data.trip.id, senderRef.current)) } catch { /* signalet er en bonus */ }
  }, [data])

  // Demo: andre faner på samme tur sender signal over BroadcastChannel, og da leses demodata på nytt (AD-10)
  useEffect(() => {
    if (!demoMode || typeof BroadcastChannel === 'undefined') return undefined
    let channel
    try { channel = new BroadcastChannel(CHANNEL_NAME) } catch { return undefined }
    channelRef.current = channel
    channel.onmessage = (event) => {
      if (!isRelevant(event?.data, dataRef.current?.trip?.id, senderRef.current)) return
      readDemoAgain()
    }
    return () => { channel.onmessage = null; channel.close(); if (channelRef.current === channel) channelRef.current = null }
  }, [readDemoAgain])

  // Begge moduser: når fanen blir synlig eller får fokus, hentes turen på nytt (høyst hvert 2. sekund)
  useEffect(() => {
    const fetchNow = () => {
      const now = Date.now()
      if (!shouldRefreshNow(lastFetchRef.current, now)) return
      if (demoMode) { lastFetchRef.current = now; readDemoAgain() }
      else if (session?.user?.id) { lastFetchRef.current = now; refresh(session.user.id) }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') fetchNow() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', fetchNow)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', fetchNow)
    }
  }, [session?.user?.id, refresh, readDemoAgain])

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
  // «Endret» per element (AD-16): bare deltakere, sett-status lokalt per enhet, tur og bruker
  const tripId = data?.trip?.id
  const [seenState, setSeenState] = useState(null)
  const seenRef = useRef(null)
  useEffect(() => {
    const next = tripId && userId && !isOrganizer && own ? loadSeen(storage, tripId, userId, new Date()) : null
    seenRef.current = next
    setSeenState(next)
  }, [tripId, userId, isOrganizer, !own]) // eslint-disable-line react-hooks/exhaustive-deps
  const changeItems = useMemo(() => data ? [...(data.program ?? []).map((item) => ({ ...item, kind: 'program' })), ...(data.trip?.destination_revealed ? (data.checkpoints ?? []) : []).map((item) => ({ ...item, kind: 'checkpoint' }))] : [], [data])
  const changedList = useMemo(() => changedItems(changeItems, seenState), [changeItems, seenState])
  const commitSeen = (next) => {
    if (!next || next === seenRef.current) return
    const merged = mergeSeen(next, readSeen(storage, tripId, userId)) // en annen fane kan ha markert andre elementer
    seenRef.current = merged
    setSeenState(merged)
    saveSeen(storage, tripId, userId, merged)
  }
  const changes = {
    isChanged: (item) => isItemChanged(item, seenState),
    markSeen: (item) => commitSeen(markItemSeen(seenRef.current, item)),
    markAllSeen: () => commitSeen(markAllItemsSeen(seenRef.current, changeItems)),
    count: changedList.length,
    items: changedList,
  }
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
      const stamp = collection === 'program' || collection === 'checkpoints' ? { updated_at: new Date().toISOString() } : {} // live setter databasen den med trigger
      const newItem = id ? { ...data[collection].find((item) => item.id === id), ...record, ...stamp } : { ...record, id: crypto.randomUUID(), trip_id: data.trip.id, ...stamp }
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
    if (!acceptsSubmissions(data.checkpoints.find((c) => c.id === checkpointId))) throw validationError('Posten er deaktivert og tar ikke imot svar.')
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

  /** Arrangøren flytter en deltaker til et lag, eller til «uten lag» (Story 4.1). Innsendinger berøres aldri. */
  async function moveMember(memberId, teamId) {
    if (!isOrganizer) throw new Error('Bare arrangøren kan flytte deltakere.')
    const result = applyMove(data.members, memberId, teamId, data.teams)
    if (result.error) throw new Error(result.error)
    if (!result.changed) return
    const target = teamId === '' || teamId === undefined ? null : teamId
    if (demoMode) setData((previous) => ({ ...previous, members: applyMove(previous.members, memberId, teamId, previous.teams).members }))
    else {
      try { await changeRecord('trip_members', memberId, { team_id: target }) }
      finally { await refresh(userId) }
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

  /** Henter poengene på nytt (Story 4.2): live henter turen, demo leser lagringen på nytt. */
  async function refreshScores() {
    if (demoMode) {
      readDemoAgain()
      return
    }
    if (!userId) return
    await refresh(userId)
  }

  function resetDemo() {
    if (!demoMode) return
    setData(resetDemoStore(storage, initialDemoData, userStorage))
    setDemoUserId(null)
    setError('')
  }

  const value = {
    demoMode, slug, path, notFound, notMember, offline, cachedAt, data, own, userId, isOrganizer, loading, error, setError, leaderboard, changes,
    moveMember, demoLogin, chooseRole, switchRole, signOut, join, organizerEmail, write, destroy, updateTrip, submit, review,
    addPhoto, deletePhoto, resetDemo, refreshScores,
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTrip() {
  const context = useContext(Context)
  if (!context) throw new Error('useTrip må brukes innenfor TripProvider.')
  return context
}
