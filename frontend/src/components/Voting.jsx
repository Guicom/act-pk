import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const MAIN_CARD_VALUES = [0, '1/2', 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', '∞']
const PAUSE_CAFE_VALUE = 'pause_cafe'

function CoffeeIcon({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  )
}

/* Palette AU - Flat UI Colors */
const CHART_COLORS = [
  '#f9ca24', // Turbo
  '#7ed6df', // Middle Blue
  '#badc58', // June Bud
  '#e056fd', // Heliotrope
  '#ff7979', // Pink Glamour
  '#22a6b3', // Greenland Green
  '#686de0', // Exodus Fruit
  '#ffbe76', // Spiced Nectarine
  '#6ab04c', // Pure Apple
  '#be2edd', // Steel Pink
]

function VotesPieChart({ votes }) {
  const data = useMemo(() => {
    const byValue = {}
    for (const value of Object.values(votes)) {
      const key = String(value)
      byValue[key] = (byValue[key] || 0) + 1
    }
    return Object.entries(byValue).map(([name, value], i) => ({
      name,
      value,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [votes])

  if (data.length === 0) return null

  return (
    <div className="h-64 mb-6 overflow-visible">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 28, right: 20, bottom: 20, left: 20 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            dataKey="value"
            label={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #95afc0',
              borderRadius: '8px',
              color: '#30336b',
            }}
            labelStyle={{ color: '#130f40' }}
            formatter={(value, name) => [value, `Vote ${name}`]}
          />
          <Legend
            formatter={(value, entry) => (
              <span className="text-[#30336b] text-sm">
                {value === 'pause_cafe' ? 'Pause café' : value}: {entry.payload.value} vote{entry.payload.value > 1 ? 's' : ''}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Voting({
  socket,
  sessionId,
  participantId,
  stories,
  currentStoryIndex,
  currentStory,
  votesRevealed,
  onRevealedReset,
  isHost,
}) {
  const [myVote, setMyVote] = useState(null)
  useEffect(() => {
    setMyVote(null)
  }, [currentStory?.id])

  function handleVote(value) {
    if (!socket || !currentStory) return
    setMyVote(value)
    socket.emit('vote_submitted', {
      sessionId,
      participantId,
      storyId: currentStory.id,
      value,
    })
  }

  function handleNext() {
    if (!socket) return
    socket.emit('next_story', { sessionId })
    setMyVote(null)
    onRevealedReset?.()
  }

  if (!currentStory && stories.length > 0) {
    return null
  }

  if (!currentStory) {
    return (
      <section className="rounded-2xl border border-[#95afc0]/60 bg-white p-6 shadow-lg shadow-black/10">
        <p className="text-[#535c68]">
          Aucune story en cours. Ajoutez des stories au backlog.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-[#95afc0]/60 bg-white p-6 shadow-lg shadow-black/10">
      <h2 className="text-lg font-semibold text-[#130f40] mb-2">Vote en cours</h2>
      <div className="mb-6 rounded-xl border-2 border-[#6ab04c]/60 bg-[#6ab04c]/10 px-4 py-3">
        <p className="text-[#130f40] font-semibold text-lg leading-snug">
          {currentStory.title}
        </p>
      </div>

      {votesRevealed ? (
        <div>
          <p className="text-sm font-medium text-[#535c68] mb-3">Répartition des votes</p>
          <VotesPieChart votes={votesRevealed.votes || {}} />
          {isHost ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-[#f9ca24] px-4 py-3 font-semibold text-[#130f40] transition hover:bg-[#f6e58d] focus:outline-none focus:ring-2 focus:ring-[#f9ca24] focus:ring-offset-2 focus:ring-offset-white"
            >
              Story suivante
            </button>
          ) : (
            <p className="text-sm text-[#535c68]">
              En attente du facilitateur pour passer à la story suivante.
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-[#535c68] mb-4">
            Choisissez une carte
          </p>
          {/* 3 lignes de cartes : 5 + 5 + 4 (100, ?, ∞, Pause café) */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 justify-items-center max-w-3xl mx-auto">
            {MAIN_CARD_VALUES.map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => handleVote(value)}
                className={`
                  relative w-20 h-28 sm:w-24 sm:h-36 md:w-28 md:h-40 rounded-xl border-2 shadow-lg transition-all duration-200
                  hover:scale-105 hover:shadow-xl hover:-translate-y-0.5
                  focus:outline-none focus:ring-2 focus:ring-[#f9ca24] focus:ring-offset-2 focus:ring-offset-white focus:scale-105
                  ${myVote === value
                    ? 'border-[#f9ca24] bg-white shadow-[#f9ca24]/40 shadow-lg scale-105 -translate-y-0.5 text-[#130f40]'
                    : 'border-[#95afc0]/70 bg-white text-[#30336b] hover:border-[#f9ca24]/80'
                  }
                `}
              >
                <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                  {value}
                </span>
                <span className="absolute top-1.5 left-1.5 text-xs sm:text-sm font-bold text-[#535c68]/80">
                  {value}
                </span>
                <span className="absolute bottom-1.5 right-1.5 text-xs sm:text-sm font-bold text-[#535c68]/80 rotate-180">
                  {value}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleVote(PAUSE_CAFE_VALUE)}
              className={`
                relative w-20 h-28 sm:w-24 sm:h-36 md:w-28 md:h-40 rounded-xl border-2 shadow-lg transition-all duration-200
                hover:scale-105 hover:shadow-xl hover:-translate-y-0.5
                focus:outline-none focus:ring-2 focus:ring-[#f9ca24] focus:ring-offset-2 focus:ring-offset-white focus:scale-105
                ${myVote === PAUSE_CAFE_VALUE
                  ? 'border-[#f9ca24] bg-white shadow-[#f9ca24]/40 shadow-lg scale-105 -translate-y-0.5'
                  : 'border-[#95afc0]/70 bg-white text-[#30336b] hover:border-[#f9ca24]/80'
                }
              `}
            >
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <CoffeeIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#f0932b]" />
                <span className="text-xs sm:text-sm font-semibold text-[#30336b]">Pause café</span>
              </span>
            </button>
          </div>
          {myVote !== null && (
            <p className="mt-4 text-sm text-[#535c68]">
              En attente des autres participants…
            </p>
          )}
        </div>
      )}
    </section>
  )
}
