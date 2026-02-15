import { useState, useRef } from 'react'
import { parseCsv } from '../utils/csvParser'
import CsvImportModal from './CsvImportModal'

export default function Backlog({ socket, sessionId, stories, currentStoryIndex = 0, isHost }) {
  const [title, setTitle] = useState('')
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const fileInputRef = useRef(null)

  // N'afficher que les stories pas encore votées (à partir de la story en cours)
  const visibleStories = stories.slice(Math.max(0, currentStoryIndex))

  function handleCsvFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text !== 'string') {
        setCsvModalOpen(false)
        setCsvData(null)
        return
      }
      const result = parseCsv(text)
      if (result.error) {
        alert(result.error)
        setCsvData(null)
      } else {
        setCsvData({ headers: result.headers, rows: result.rows })
        setCsvModalOpen(true)
      }
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  function handleCsvImport(titles) {
    if (!socket || !sessionId) return
    titles.forEach((storyTitle) => {
      if (storyTitle.trim()) {
        socket.emit('story_added', { sessionId, title: storyTitle.trim() })
      }
    })
  }

  function handleAddStory(e) {
    e.preventDefault()
    if (!title.trim() || !socket) return
    socket.emit('story_added', { sessionId, title: title.trim() })
    setTitle('')
  }

  function moveStory(visibleIndex, delta) {
    const realIndex = currentStoryIndex + visibleIndex
    if (!socket || realIndex + delta < 0 || realIndex + delta >= stories.length) return
    const newOrder = [...stories]
    const [removed] = newOrder.splice(realIndex, 1)
    newOrder.splice(realIndex + delta, 0, removed)
    const storyIds = newOrder.map((s) => s.id)
    socket.emit('story_reordered', { sessionId, storyIds })
  }

  function skipStory(storyId) {
    if (!socket) return
    socket.emit('story_skipped', { sessionId, storyId })
  }

  return (
    <section className="rounded-2xl border border-[#95afc0]/60 bg-white p-6 shadow-lg shadow-black/10">
      <h2 className="text-lg font-semibold text-[#130f40] mb-4">
        Backlog
        <span className="ml-2 font-normal text-[#535c68]">
          ({visibleStories.length} US restante{visibleStories.length !== 1 ? 's' : ''})
        </span>
      </h2>

      <ul className="space-y-2">
        {visibleStories.map((story, index) => (
          <li
            key={story.id}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
              story.skipped
                ? 'border-[#95afc0]/40 bg-gray-50 opacity-70'
                : 'border-[#95afc0]/50 bg-gray-50/80 hover:border-[#686de0]/50 hover:bg-white'
            }`}
          >
            <span className={story.skipped ? 'text-[#535c68] line-through' : 'text-[#30336b]'}>
              {story.title}
            </span>
            {isHost && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveStory(index, -1)}
                  disabled={index === 0}
                  title="Monter"
                  className="rounded-lg border border-[#95afc0]/70 bg-white p-2 text-[#535c68] transition hover:bg-[#686de0]/10 hover:text-[#30336b] hover:border-[#686de0]/50 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStory(index, 1)}
                  disabled={index === visibleStories.length - 1}
                  title="Descendre"
                  className="rounded-lg border border-[#95afc0]/70 bg-white p-2 text-[#535c68] transition hover:bg-[#686de0]/10 hover:text-[#30336b] hover:border-[#686de0]/50 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
                >
                  ↓
                </button>
                {!story.skipped && (
                  <button
                    type="button"
                    onClick={() => skipStory(story.id)}
                    title="Passer"
                    className="ml-1 rounded-lg border border-[#95afc0]/70 bg-white px-3 py-2 text-sm text-[#535c68] transition hover:bg-[#686de0]/10 hover:text-[#30336b] hover:border-[#686de0]/50 focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
                  >
                    Passer
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {isHost && (
        <div className="mt-6 pt-4 border-t border-[#95afc0]/40 space-y-3">
          <form onSubmit={handleAddStory} className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la user story"
              className="flex-1 rounded-lg border border-[#95afc0]/70 bg-gray-50 px-3 py-2.5 text-[#130f40] placeholder-[#95afc0] focus:border-[#f9ca24] focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#f9ca24] px-4 py-2.5 font-medium text-[#130f40] transition hover:bg-[#f6e58d] focus:outline-none focus:ring-2 focus:ring-[#f9ca24] focus:ring-offset-2 focus:ring-offset-white"
            >
              Ajouter
            </button>
          </form>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="hidden"
              aria-hidden
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#95afc0]/70 bg-white px-4 py-2 text-sm font-medium text-[#535c68] transition hover:bg-[#686de0]/10 hover:border-[#686de0]/50 hover:text-[#30336b] focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
            >
              Importer un CSV
            </button>
          </div>
        </div>
      )}

      <CsvImportModal
        open={csvModalOpen}
        onClose={() => { setCsvModalOpen(false); setCsvData(null) }}
        csvData={csvData}
        onImport={handleCsvImport}
      />
    </section>
  )
}
