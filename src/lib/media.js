// Ren: velger hvilke lagringsstier som skal signeres, og legger signerte URL-er på bildene (AD-11).

function list(items) {
  return Array.isArray(items) ? items.filter((item) => item && typeof item === 'object') : []
}

function belongsToTrip(path, tripId) {
  return typeof path === 'string' && path !== '' && typeof tripId === 'string' && tripId !== '' && path.startsWith(`${tripId}/`) && !path.split('/').includes('..')
}

/** Unike storage_path som hører til turen. */
export function pathsToSign(items, tripId) {
  const paths = new Set()
  for (const item of list(items)) {
    if (belongsToTrip(item.storage_path, tripId)) paths.add(item.storage_path)
  }
  return [...paths]
}

/** Legger url på hvert element fra svarradene { path, signedUrl, error }. Elementer uten storage_path beholder url. */
export function applySignedUrls(items, signed) {
  const urls = new Map()
  for (const row of list(signed)) {
    if (typeof row.path === 'string' && !row.error && typeof row.signedUrl === 'string' && row.signedUrl) urls.set(row.path, row.signedUrl)
  }
  return list(items).map((item) => {
    if (!item.storage_path) return item
    return { ...item, url: urls.get(item.storage_path) ?? null }
  })
}
