'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface Props {
  getFormValues: () => { title: string; location: string; category: string }
  onResult: (text: string) => void
}

export default function AiDescriptionButton({ getFormValues, onResult }: Props) {
  const [loading, setLoading] = useState(false)

  async function generate() {
    const { title, location, category } = getFormValues()
    if (!title) return

    setLoading(true)
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, location, category }),
      })
      const data = await res.json()
      if (data.text) onResult(data.text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
      {loading ? 'Writing...' : 'Write with AI'}
    </button>
  )
}