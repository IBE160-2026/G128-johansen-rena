/**
 * Poengregnskap (AD-5). Ren logikk, ingen avhengigheter. Samme regel skal gjelde i viewet `team_scores` i databasen.
 *
 * Lagets poeng er summen av postens gjeldende poeng for poster der laget har minst én godkjent innsending.
 * Hver post teller maks én gang per lag, ventende og avviste teller ikke, deaktiverte poster teller fortsatt,
 * og en innsending til en ukjent post gir 0. Endres postens poeng, gjelder de nye poengene for alle som har løst den.
 */

/** Poengene en post gir. Ugyldige verdier (negative, ikke tall) regnes som 0, så summen aldri blir negativ. */
export function pointsOf(checkpoint) {
  const points = checkpoint?.points
  return typeof points === 'number' && Number.isFinite(points) && points > 0 ? points : 0
}

/**
 * Poeng og antall løste poster per lag. Tomme eller manglende oppføringer hoppes over,
 * og ved dobbelt id gjelder den første (som i databasen, der id er unik).
 * @returns {Map<string, { points: number, completed: number }>}
 */
export function teamScores(teams, checkpoints, submissions) {
  const pointsById = new Map()
  for (const checkpoint of checkpoints ?? []) {
    if (checkpoint && !pointsById.has(checkpoint.id)) pointsById.set(checkpoint.id, pointsOf(checkpoint))
  }
  const solved = new Map() // lag -> poster med godkjent innsending
  for (const team of teams ?? []) if (team && !solved.has(team.id)) solved.set(team.id, new Set())
  for (const submission of submissions ?? []) {
    if (submission?.status !== 'approved') continue
    const posts = solved.get(submission.team_id)
    if (posts && pointsById.has(submission.checkpoint_id)) posts.add(submission.checkpoint_id)
  }
  const scores = new Map()
  for (const [teamId, posts] of solved) {
    let points = 0
    for (const checkpointId of posts) points += pointsById.get(checkpointId)
    scores.set(teamId, { points, completed: posts.size })
  }
  return scores
}

/** Lagene med poeng (hver id én gang), sortert på poeng (synkende) og deretter navn (norsk rekkefølge). */
export function standings(teams, checkpoints, submissions) {
  const scores = teamScores(teams, checkpoints, submissions)
  const seen = new Set()
  return (teams ?? [])
    .filter((team) => team && !seen.has(team.id) && seen.add(team.id))
    .map((team) => ({ ...team, ...scores.get(team.id) }))
    .sort((a, b) => b.points - a.points || String(a.name).localeCompare(String(b.name), 'nb'))
}

/** Har posten innsendinger? Da kan den deaktiveres, men ikke slettes (AD-13), ellers forsvinner poengene. */
export function hasSubmissions(checkpointId, submissions) {
  return (submissions ?? []).some((submission) => submission?.checkpoint_id === checkpointId)
}
