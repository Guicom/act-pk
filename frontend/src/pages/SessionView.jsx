import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { apiOrigin } from '../config'
import Backlog from '../components/Backlog'
import Voting from '../components/Voting'
import InviteLink from '../components/InviteLink'

export default function SessionView() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const participantId = location.state?.participantId ?? sessionStorage.getItem(`participant_${sessionId}`)
  const isHost = location.state?.isHost ?? false
  const sessionName =
    location.state?.sessionName ??
    sessionStorage.getItem(`sessionName_${sessionId}`) ??
    sessionId

  const [socket, setSocket] = useState(null)
  const [stories, setStories] = useState([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [votesRevealed, setVotesRevealed] = useState(null)
  const [participants, setParticipants] = useState([])
  const [voterIds, setVoterIds] = useState([])

  useEffect(() => {
    if (!sessionId || !participantId) {
      navigate(sessionId ? `/join?session=${sessionId}` : '/join')
      return
    }

    const s = io(apiOrigin || undefined, { path: '/socket.io' })
    s.on('connect', () => s.emit('join_session', { sessionId, participantId }))
    s.on('backlog_updated', (payload) => {
      const newStories = Array.isArray(payload.stories) ? [...payload.stories] : []
      setStories(newStories)
      if (payload.currentStoryIndex !== undefined) setCurrentStoryIndex(Number(payload.currentStoryIndex))
      if (payload.participants !== undefined) setParticipants(payload.participants)
      if (payload.voterIds !== undefined) setVoterIds(payload.voterIds)
    })
    s.on('voters_updated', (payload) => {
      setVoterIds(payload.voterIds ?? [])
    })
    s.on('votes_revealed', (payload) => {
      setVotesRevealed(payload)
    })
    s.on('current_story_updated', (payload) => {
      if (payload.currentStoryIndex !== undefined) setCurrentStoryIndex(Number(payload.currentStoryIndex))
      setVotesRevealed(null)
    })
    s.on('session_complete', () => {
      setSessionComplete(true)
      setVotesRevealed(null)
    })
    s.on('participants_updated', (payload) => {
      setParticipants(payload.participants ?? [])
    })
    setSocket(s)
    return () => s.disconnect()
  }, [sessionId, participantId, navigate])

  if (!participantId) return null

  const currentStory =
    currentStoryIndex < stories.length ? stories[currentStoryIndex] : null

  return (
    <div className="min-h-screen bg-[#eef0f2] text-[#30336b]">
      <header className="sticky top-0 z-10 border-b border-[#95afc0]/50 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl font-bold text-[#130f40] truncate">
            {sessionName}
          </h1>
          {isHost && <InviteLink sessionId={sessionId} />}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col lg:flex-row lg:items-start gap-6">
        <main className="flex-1 min-w-0 flex flex-col gap-8">
          {sessionComplete ? (
            <div className="rounded-2xl border border-[#95afc0]/60 bg-white p-12 text-center shadow-lg shadow-black/10">
              <h2 className="text-2xl font-semibold text-[#130f40] mb-2">
                Sprint planning terminé
              </h2>
              <p className="text-[#535c68]">
                Plus de stories à estimer.
              </p>
            </div>
          ) : (
            <>
              <Voting
                socket={socket}
                sessionId={sessionId}
                participantId={participantId}
                stories={stories}
                currentStoryIndex={currentStoryIndex}
                currentStory={currentStory}
                votesRevealed={votesRevealed}
                onRevealedReset={() => setVotesRevealed(null)}
                isHost={isHost}
              />
              <Backlog
                socket={socket}
                sessionId={sessionId}
                stories={stories}
                currentStoryIndex={currentStoryIndex}
                isHost={isHost}
              />
            </>
          )}
        </main>

        <aside className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24 rounded-2xl border border-[#95afc0]/60 bg-white p-6 shadow-lg shadow-black/10">
            <h2 className="text-base font-semibold text-[#535c68] uppercase tracking-wider mb-4">
              Participants ({participants.length})
            </h2>
            <ul className="space-y-2.5">
              {participants.map((p) => {
                const vote = votesRevealed?.votes?.[p.id]
                const hasVoted = voterIds.includes(p.id)
                return (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-base ${
                      p.id === participantId
                        ? 'bg-[#f9ca24]/25 text-[#130f40] font-medium border border-[#f9ca24]/50'
                        : 'text-[#30336b] border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#6ab04c] shrink-0" aria-hidden />
                      <span className="truncate">{p.name}</span>
                      {p.id === participantId && (
                        <span className="text-xs text-[#b8860b] shrink-0">(vous)</span>
                      )}
                    </span>
                    {vote !== undefined ? (
                      <span className="shrink-0 rounded-md bg-[#f9ca24]/30 px-2.5 py-1 text-sm font-semibold text-[#130f40]">
                        {vote === 'pause_cafe' ? '☕' : String(vote)}
                      </span>
                    ) : hasVoted ? (
                      <span className="shrink-0 rounded-md bg-[#6ab04c]/20 px-2.5 py-1 text-xs font-medium text-[#2d5a2d]" title="A voté">
                        ✓ A voté
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-[#95afc0]" title="En attente de vote">
                        En attente
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            {participants.length === 0 && (
              <p className="text-base text-[#535c68] py-3">Aucun participant pour l’instant.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
