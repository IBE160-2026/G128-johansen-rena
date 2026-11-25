import { validateTrip } from './validate.js'

/**
 * Ren validering av én endring i en tur (Story 5.1, AD-1, AD-2). Setter endringen inn i en kopi av turen,
 * kjører validateTrip og gir bare feilene som gjelder det endrede elementet, knyttet til felt.
 *
 * @param {{ trip: object, program: object[], checkpoints: object[], teams: object[] }} data
 * @param {'program' | 'checkpoints'} collection
 * @param {object} record feltene som lagres
 * @param {string | null} id tom for et nytt element
 * @returns {{ ok: true } | { ok: false, errors: { field: string | null, message: string }[] }}
 */
const SHOWN = { program: ['event_date', 'start_time', 'title', 'description'], checkpoints: ['title', 'description', 'points', 'latitude', 'longitude'] }
const MAX_LENGTH = { title: 120, description: 1000 }

export function validateChange(data, collection, record, id) {
  const fail = (message) => ({ ok: false, errors: [{ field: null, message }] })
  if (data === null || typeof data !== 'object' || !data.trip || typeof data.trip !== 'object') return fail('Turen mangler, så endringen kan ikke kontrolleres.')
  if (collection !== 'program' && collection !== 'checkpoints') return fail('Ukjent type element.')
  if (record === null || typeof record !== 'object' || Array.isArray(record)) return fail('Endringen mangler data.')
  const list = Array.isArray(data[collection]) ? data[collection] : []
  const isNew = id === null || id === undefined || id === ''
  const index = isNew ? -1 : list.findIndex((item) => item.id === id)
  if (!isNew && index === -1) return fail('Fant ikke elementet som skal endres.')

  const merged = isNew ? { ...record, id: 'ny-endring' } : { ...list[index], ...record, id }
  const next = isNew ? [...list, merged] : list.map((item, i) => (i === index ? merged : item))
  const position = isNew ? next.length - 1 : index
  const draftOf = (items) => ({
    trip: data.trip,
    program_items: collection === 'program' ? items : (data.program ?? []),
    checkpoints: collection === 'checkpoints' ? items : (data.checkpoints ?? []),
    teams: data.teams ?? [],
  })

  const result = validateTrip(draftOf(next))
  const issues = result.ok ? [] : result.issues

  const key = collection === 'program' ? 'program_items' : 'checkpoints'
  const prefix = `${key}[${position}]`
  // Felt som ikke er endret, kan ikke blokkere (eldre data kan redigeres uten å røre det som er galt)
  const unchanged = (field) => !isNew && (!Object.prototype.hasOwnProperty.call(record, field) || Object.is(record[field], list[index][field]))
  const errors = []
  const push = (field, message) => {
    if (field !== null && unchanged(field)) return
    errors.push({ field: field !== null && SHOWN[collection].includes(field) ? field : null, message })
  }
  for (const issue of issues) {
    if (issue.path === prefix) push(null, issue.message)
    else if (issue.path.startsWith(`${prefix}.`)) push(issue.path.slice(prefix.length + 1), issue.message)
  }

  // Det skjemaene tidligere sjekket med required og maxLength, og som validateTrip ikke dekker
  const text = (value) => (typeof value === 'string' ? value.trim() : '')
  if (collection === 'checkpoints' && (isNew || 'description' in record) && !unchanged('description') && !text(merged.description)) errors.push({ field: 'description', message: 'Oppgaven må ha en beskrivelse.' })
  for (const [field, max] of Object.entries(MAX_LENGTH)) {
    if (typeof merged[field] === 'string' && merged[field].length > max && !unchanged(field)) errors.push({ field, message: `Kan ikke være lengre enn ${max} tegn.` })
  }

  // Datoer som mangler programposter tas bare med når denne endringen er årsaken (og datoen ikke allerede er feil).
  if (collection === 'program' && !errors.some((e) => e.field === 'event_date')) {
    const before = new Set((validateTrip(draftOf(list)).issues ?? []).filter((i) => i.path === 'program_items').map((i) => i.message))
    for (const issue of issues) {
      if (issue.path === 'program_items' && !before.has(issue.message)) errors.push({ field: null, message: issue.message })
    }
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
