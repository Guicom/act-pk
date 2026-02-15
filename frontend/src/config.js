/**
 * Origine du backend (API + Socket.IO).
 * En local : vide = même origine (proxy Vite).
 * En prod (ex. Vercel) : définir VITE_API_ORIGIN avec l’URL du backend (ex. https://mon-backend.railway.app).
 */
export const apiOrigin = import.meta.env.VITE_API_ORIGIN || ''

export function apiUrl(path) {
  const base = apiOrigin.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}
