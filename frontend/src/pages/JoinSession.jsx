import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiUrl } from '../config'

export default function JoinSession() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionFromUrl = searchParams.get('session') || ''

  const [sessionId, setSessionId] = useState(sessionFromUrl)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!displayName.trim()) {
      setError('Le nom est requis')
      return
    }
    if (!sessionId.trim()) {
      setError('Le code d’accès est requis')
      return
    }
    setLoading(true)
    const sid = sessionId.trim()
    try {
      const res = await fetch(apiUrl(`/api/sessions/${sid}/join`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 404) setError('Sprint planning introuvable')
        else if (res.status === 400) setError(data.error || 'Données invalides')
        else setError('Erreur lors de la connexion')
        return
      }
      const { participantId, sessionName } = data
      sessionStorage.setItem(`participant_${sid}`, participantId)
      if (sessionName) sessionStorage.setItem(`sessionName_${sid}`, sessionName)
      navigate(`/session/${sid}`, {
        state: { participantId, sessionName: sessionName || null },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#130f40]">
            Rejoindre un sprint planning
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#95afc0]/60 bg-white p-6 shadow-lg shadow-black/10 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-[#535c68]">Code d’accès</span>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Ex: a1b2c3d4"
              className="mt-1.5 w-full rounded-lg border border-[#95afc0]/70 bg-gray-50 px-3 py-2.5 text-[#130f40] placeholder-[#95afc0] focus:border-[#f9ca24] focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#535c68]">Votre nom</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Alice"
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-[#95afc0]/70 bg-gray-50 px-3 py-2.5 text-[#130f40] placeholder-[#95afc0] focus:border-[#f9ca24] focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
            />
          </label>
          {error && (
            <p className="text-sm text-[#c0392b] font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#f9ca24] px-4 py-3 font-semibold text-[#130f40] transition hover:bg-[#f6e58d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#f9ca24] focus:ring-offset-2 focus:ring-offset-white"
          >
            {loading ? 'Connexion…' : 'Rejoindre'}
          </button>
        </form>

        <p className="text-center">
          <a
            href="/"
            className="text-sm text-[#535c68] underline decoration-[#686de0]/50 underline-offset-2 hover:text-[#30336b] hover:decoration-[#686de0]"
          >
            Retour à l’accueil
          </a>
        </p>
      </div>
    </div>
  )
}
