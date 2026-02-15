import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [sprintName, setSprintName] = useState('')
  const [hostName, setHostName] = useState('')

  async function handleCreateSession(e) {
    e.preventDefault()
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sprintName: sprintName.trim() || undefined,
        name: hostName.trim() || 'Host',
      }),
    })
    if (!res.ok) return
    const { sessionId, participantId, sessionName } = await res.json()
    sessionStorage.setItem(`participant_${sessionId}`, participantId)
    if (sessionName) sessionStorage.setItem(`sessionName_${sessionId}`, sessionName)
    navigate(`/session/${sessionId}`, {
      state: { participantId, isHost: true, sessionName: sessionName || 'Sprint planning' },
    })
  }

  function handleJoin() {
    navigate('/join')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#130f40]">
            Planning Poker
          </h1>
          <p className="text-[#535c68] text-lg">
            Estimez vos user stories en temps réel
          </p>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={handleCreateSession}
            className="rounded-2xl border border-[#95afc0]/60 bg-white p-6 shadow-lg shadow-black/10"
          >
            <h2 className="text-lg font-semibold text-[#130f40] mb-4">
              Créer un sprint planning
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#535c68]">Nom du sprint planning</span>
                <input
                  type="text"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  placeholder="Ex: Sprint 42 - Janvier"
                  className="mt-1.5 w-full rounded-lg border border-[#95afc0]/70 bg-gray-50 px-3 py-2.5 text-[#130f40] placeholder-[#95afc0] focus:border-[#f9ca24] focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#535c68]">Votre nom (facultatif)</span>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="Ex: Host"
                  className="mt-1.5 w-full rounded-lg border border-[#95afc0]/70 bg-gray-50 px-3 py-2.5 text-[#130f40] placeholder-[#95afc0] focus:border-[#f9ca24] focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-[#f9ca24] px-4 py-3 font-semibold text-[#130f40] transition hover:bg-[#f6e58d] focus:outline-none focus:ring-2 focus:ring-[#f9ca24] focus:ring-offset-2 focus:ring-offset-white"
            >
              Créer le sprint planning
            </button>
          </form>

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-[#535c68]">Déjà invité ?</p>
            <button
              type="button"
              onClick={handleJoin}
              className="rounded-lg border-2 border-[#686de0] bg-transparent px-5 py-2.5 font-medium text-[#30336b] transition hover:bg-[#686de0]/15 hover:border-[#686de0]"
            >
              Rejoindre un sprint planning
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
