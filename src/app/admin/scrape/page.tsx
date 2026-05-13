'use client'

import { useState } from 'react'
import { scrapeHamiltonLibraries, importScrapedEvents, ScrapedEvent } from './actions'
import { RefreshCw, Download, Check, AlertCircle, Loader2, ExternalLink, Calendar } from 'lucide-react'

type Status = 'idle' | 'scraping' | 'previewing' | 'importing' | 'done' | 'error'

export default function ScrapePage() {
  const [status, setStatus] = useState<Status>('idle')
  const [previews, setPreviews] = useState<ScrapedEvent[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Scrape ────────────────────────────────────────────────────────────────
  async function handleScrape() {
    setStatus('scraping')
    setErrorMsg(null)
    setMessage(null)
    setPreviews([])
    setSelected(new Set())

    const result = await scrapeHamiltonLibraries()

    if (result.error) {
      setErrorMsg(result.error)
      setStatus('error')
      return
    }

    if (result.previews.length === 0) {
      setErrorMsg('No events found on the page.')
      setStatus('error')
      return
    }

    setPreviews(result.previews)
    setSelected(new Set(result.previews.map((_, i) => i))) // select all by default
    setStatus('previewing')
  }

  // ── Import ────────────────────────────────────────────────────────────────
  async function handleImport() {
    setStatus('importing')
    const toImport = previews.filter((_, i) => selected.has(i))
    const result = await importScrapedEvents(toImport)

    if (result.error) {
      setErrorMsg(result.error)
      setStatus('error')
      return
    }

    setMessage(`✅ Imported ${result.created} event${result.created !== 1 ? 's' : ''}. ${result.skipped > 0 ? `${result.skipped} skipped (already exist).` : ''}`)
    setStatus('done')
    setPreviews([])
    setSelected(new Set())
  }

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === previews.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(previews.map((_, i) => i)))
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
            <Calendar size={18} className="text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hamilton Libraries Scraper</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">
          Fetch events from{' '}
          <a
            href="https://hamiltonlibraries.co.nz/whats-on/event-calendar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 underline hover:text-violet-800 inline-flex items-center gap-1"
          >
            hamiltonlibraries.co.nz
            <ExternalLink size={11} />
          </a>{' '}
          and import them into your events database.
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-0.5 text-red-600">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success banner */}
      {message && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          <Check size={16} className="shrink-0" />
          {message}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handleScrape}
          disabled={status === 'scraping' || status === 'importing'}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          {status === 'scraping' ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          {status === 'scraping' ? 'Scraping…' : 'Scrape Events'}
        </button>

        {status === 'previewing' && selected.size > 0 && (
          <button
            onClick={handleImport}
            disabled={status === 'importing'}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Download size={15} />
            Import {selected.size} selected
          </button>
        )}
      </div>

      {/* Preview table */}
      {status === 'previewing' && previews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              Found <span className="text-violet-600 font-semibold">{previews.length}</span> events — select which to import:
            </p>
            <button
              onClick={toggleAll}
              className="text-xs text-violet-600 hover:underline font-medium"
            >
              {selected.size === previews.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {previews.map((ev, i) => (
              <label
                key={i}
                className={`flex gap-4 items-start p-4 rounded-xl border cursor-pointer transition-colors ${
                  selected.has(i)
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="mt-1 accent-violet-600 w-4 h-4 shrink-0"
                />

                {/* Thumbnail */}
                {ev.imageUrl ? (
                  <img
                    src={ev.imageUrl}
                    alt={ev.title}
                    className="w-20 h-16 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-20 h-16 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center">
                    <Calendar size={18} className="text-gray-300" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{ev.title}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {ev.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    🕐 {ev.startTime.toLocaleDateString('en-NZ', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                    {ev.endTime && ` → ${ev.endTime.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                  {ev.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>
                  )}
                  <a
                    href={ev.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-violet-500 hover:underline mt-1"
                  >
                    View source <ExternalLink size={10} />
                  </a>
                </div>
              </label>
            ))}
          </div>

          {selected.size > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleImport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Download size={15} />
                Import {selected.size} event{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {status === 'idle' && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
          <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No events scraped yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Scrape Events" to fetch from Hamilton Libraries</p>
        </div>
      )}

    </main>
  )
}
