'use client'

import { useState, useTransition, useMemo } from 'react'
import { Event } from '@prisma/client'
import { setEventFlagged, adminDeleteEvent } from '@/app/admin/actions'
import { Flag, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

type EventWithAuthor = Event & {
  author: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  } | null
}

const CATEGORIES = ['OUTDOOR', 'MUSIC', 'SPORTS', 'FOOD', 'TECH', 'ARTS', 'CHARITY', 'OTHER']

export default function EventsTable({ events }: { events: EventWithAuthor[] }) {
  const [search, setSearch]           = useState('')
  const [filterFlag, setFilterFlag]   = useState<'all' | 'flagged' | 'unflagged'>('all')
  const [filterCat, setFilterCat]     = useState('')
  const [loadingId, setLoadingId]     = useState<string | null>(null)
  const [, startTransition]           = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return events.filter(e => {
      if (q && !e.title.toLowerCase().includes(q) && !(e.author?.email ?? '').toLowerCase().includes(q)) return false
      if (filterFlag === 'flagged'   && !e.flagged) return false
      if (filterFlag === 'unflagged' &&  e.flagged) return false
      if (filterCat && e.category !== filterCat)    return false
      return true
    })
  }, [events, search, filterFlag, filterCat])

  function handleFlag(id: string, flagged: boolean) {
    setLoadingId(id)
    startTransition(async () => {
      await setEventFlagged(id, flagged)
      setLoadingId(null)
    })
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setLoadingId(id + ':del')
    startTransition(async () => {
      await adminDeleteEvent(id)
      setLoadingId(null)
    })
  }

  const flaggedCount = events.filter(e => e.flagged).length

  return (
    <div>
      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 min-w-[100px]">
          <p className="text-2xl font-bold text-gray-900">{events.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total events</p>
        </div>
        <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-100 min-w-[100px]">
          <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Flagged</p>
        </div>
        <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 min-w-[100px]">
          <p className="text-2xl font-bold text-blue-600">{events.length - flaggedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Clear</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search title or author email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <div className="flex gap-1">
          {(['all', 'flagged', 'unflagged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterFlag(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                filterFlag === f
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} event{filtered.length !== 1 ? 's' : ''} shown</p>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Author</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    No events match your filters
                  </td>
                </tr>
              ) : (
                filtered.map(event => {
                  const busy = loadingId === event.id || loadingId === event.id + ':del'
                  return (
                    <tr
                      key={event.id}
                      className={`hover:bg-gray-50 transition-colors ${event.flagged ? 'bg-red-50/40' : ''}`}
                    >
                      {/* Event */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {event.imageUrl ? (
                            <img
                              src={event.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/events/${event.id}`}
                              target="_blank"
                              className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1 truncate"
                            >
                              {event.title}
                              <ExternalLink size={11} className="opacity-40 shrink-0" />
                            </Link>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {event.location}</p>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {event.author?.image ? (
                            <img src={event.author.image} alt="" className="w-6 h-6 rounded-full shrink-0" />
                          ) : (
                            <div className="w-6 h-6 bg-blue-600 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold">
                              {event.author?.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{event.author?.name ?? '—'}</p>
                            <p className="text-xs text-gray-400 truncate">{event.author?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                          {event.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {event.startTime.toLocaleDateString('en-NZ', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {event.flagged ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-600 px-2 py-1 rounded-full whitespace-nowrap">
                            <Flag size={10} className="fill-red-500" /> Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {busy ? (
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleFlag(event.id, !event.flagged)}
                                title={event.flagged ? 'Unflag this event' : 'Flag for review'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  event.flagged
                                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                                    : 'border-gray-200 text-gray-400 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500'
                                }`}
                              >
                                <Flag size={14} className={event.flagged ? 'fill-red-400' : ''} />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id, event.title)}
                                title="Delete event"
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
