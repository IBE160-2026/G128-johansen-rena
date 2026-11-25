/** Regler for lag og lagfordeling (Story 4.1). Ren logikk uten avhengigheter. */

export const TEAM_COLORS = ['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6']

/**
 * Lagets fargetoken. Har laget en gyldig farge, brukes den. Ellers (eldre data) får lag uten farge hver sin ledige farge
 * i rekkefølgen de står i, slik at ingen av de seks første lagene deler farge.
 */
export function teamColorToken(team, teams = []) {
  if (TEAM_COLORS.includes(team?.color)) return team.color
  const list = (teams ?? []).filter(Boolean)
  const used = new Set(list.filter((other) => TEAM_COLORS.includes(other.color)).map((other) => other.color))
  const free = TEAM_COLORS.filter((color) => !used.has(color))
  const position = Math.max(list.filter((other) => !TEAM_COLORS.includes(other.color)).indexOf(team), 0)
  return free.length ? free[position % free.length] : TEAM_COLORS[position % TEAM_COLORS.length]
}

/**
 * Flytter en deltaker til et lag (eller til «uten lag» med `null`). Samme lag endrer ingenting og gir samme liste tilbake.
 * Innsendinger berøres aldri: de har `team_id` for laget som sendte dem.
 * @returns {{ members: object[], changed: boolean, error?: string }}
 */
export function moveMember(members, memberId, teamId, teams) {
  const member = (members ?? []).find((entry) => entry?.id === memberId)
  if (!member) return { members, changed: false, error: 'Fant ikke deltakeren.' }
  const target = teamId === '' || teamId === undefined ? null : teamId
  if (target !== null && !(teams ?? []).some((team) => team?.id === target)) return { members, changed: false, error: 'Fant ikke laget.' }
  if ((member.team_id ?? null) === target) return { members, changed: false }
  return { members: members.map((entry) => (entry.id === memberId ? { ...entry, team_id: target } : entry)), changed: true }
}

/** Antall deltakere per lag, og antall uten lag (eller med et lag som ikke finnes). */
export function memberCounts(members, teams) {
  const counts = new Map((teams ?? []).filter(Boolean).map((team) => [team.id, 0]))
  let withoutTeam = 0
  for (const member of members ?? []) {
    if (!member) continue
    if (counts.has(member.team_id)) counts.set(member.team_id, counts.get(member.team_id) + 1)
    else withoutTeam += 1
  }
  return { counts, withoutTeam }
}
