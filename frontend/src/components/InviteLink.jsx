import { useState } from 'react'

export default function InviteLink({ sessionId }) {
  const [copied, setCopied] = useState(false)
  const inviteLink = `${window.location.origin}/join?session=${sessionId}`

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink)
      } else {
        const input = document.createElement('input')
        input.value = inviteLink
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="w-full sm:w-auto min-w-0">
      <label className="block text-xs font-medium text-[#535c68] mb-1.5">
        Lien d’invitation
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={inviteLink}
          className="flex-1 min-w-0 rounded-lg border border-[#95afc0]/70 bg-gray-50 px-3 py-2 text-sm text-[#130f40] truncate"
        />
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-lg bg-[#f9ca24] px-4 py-2 text-sm font-medium text-[#130f40] transition hover:bg-[#f6e58d] focus:outline-none focus:ring-2 focus:ring-[#f9ca24] focus:ring-offset-2 focus:ring-offset-white"
        >
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
    </div>
  )
}
