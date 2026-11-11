import { validateImage } from './core.js'

/**
 * Demo images live in localStorage, so resize camera photos before saving.
 * Real Supabase uploads keep the original file (up to 8 MB).
 */
export async function demoImageDataUrl(file) {
  validateImage(file)
  const url = URL.createObjectURL(file)
  try {
    const picture = new Image()
    await new Promise((resolve, reject) => {
      picture.onload = resolve
      picture.onerror = () => reject(new Error('Nettleseren kan ikke lese bildet. Prøv JPG eller PNG.'))
      picture.src = url
    })

    const canvas = document.createElement('canvas')
    const longest = Math.max(picture.naturalWidth, picture.naturalHeight)
    const initialScale = Math.min(1, 1280 / longest)
    canvas.width = Math.max(1, Math.round(picture.naturalWidth * initialScale))
    canvas.height = Math.max(1, Math.round(picture.naturalHeight * initialScale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Bildet kunne ikke behandles.')

    // Shrink progressively until a normal smartphone photo fits localStorage.
    for (let attempt = 0; attempt < 7; attempt += 1) {
      ctx.drawImage(picture, 0, 0, canvas.width, canvas.height)
      const encoded = canvas.toDataURL('image/jpeg', Math.max(0.45, 0.78 - attempt * 0.07))
      if (encoded.length <= 380000) return encoded
      canvas.width = Math.max(1, Math.round(canvas.width * 0.8))
      canvas.height = Math.max(1, Math.round(canvas.height * 0.8))
    }
    throw new Error('Bildet er for stort for demomodus. Prøv et annet bilde.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
