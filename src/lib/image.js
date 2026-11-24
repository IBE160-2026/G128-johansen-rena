import { MAX_SIDE_PX, scaleToFit } from './submission.js'
import { validateImage } from './core.js'

/**
 * Komprimerer et bilde i nettleseren til JPEG med lengste side høyst `maxSide` (AD-11).
 * Kontrollerer filtype og størrelse (maks 15 MB) før komprimering.
 * @returns {Promise<Blob>}
 */
const LOAD_TIMEOUT_MS = 20000
const MAX_PIXELS = 100_000_000 // over dette sprenger lerretet minnet på mobil

export async function compressImage(file, maxSide = MAX_SIDE_PX, quality = 0.82) {
  validateImage(file)
  const url = URL.createObjectURL(file)
  try {
    const picture = new Image()
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Bildet tok for lang tid å lese. Prøv et mindre bilde.')), LOAD_TIMEOUT_MS)
      picture.onload = () => { clearTimeout(timer); resolve() }
      picture.onerror = () => { clearTimeout(timer); reject(new Error('Nettleseren kan ikke lese bildet. Prøv et annet bilde.')) }
      picture.src = url
    })
    if (picture.naturalWidth * picture.naturalHeight > MAX_PIXELS) throw new Error('Bildet har for mange piksler. Velg et mindre bilde.')
    const { width, height } = scaleToFit(picture.naturalWidth, picture.naturalHeight, maxSide)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Bildet kunne ikke behandles.')
    context.fillStyle = '#fff' // gjennomsiktige områder skal ikke bli svarte i JPEG
    context.fillRect(0, 0, width, height)
    context.drawImage(picture, 0, 0, width, height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('Bildet kunne ikke behandles.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
