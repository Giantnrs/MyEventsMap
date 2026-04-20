"use client"
import { Event } from "@prisma/client"
import { useState, useMemo } from "react"
import { List, Map as MapIcon } from "lucide-react"
import EventList from "@/components/EventList"
import FilterBar, { Filters, DEFAULT_FILTERS } from "@/components/FilterBar"
import dynamic from "next/dynamic"

const EventMap = dynamic(() => import("@/components/EventMap"), {
  ssr: false,
  loading: () => <p className="p-6 text-gray-500">Loading map...</p>,
})

export default function HomeClient({
  events,
  savedIds,
}: {
  events: Event[]
  savedIds: string[]
}) {
  const [view, setView] = useState<"list" | "map">("list")
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    const now = new Date()
    const search = filters.search.toLowerCase()

    return events.filter(event => {
      if (search && !event.title.toLowerCase().includes(search) && !event.location.toLowerCase().includes(search)) {
        return false
      }
      if (filters.category && event.category !== filters.category) return false
      if (filters.dateFrom && event.startTime < new Date(filters.dateFrom)) return false
      if (filters.dateTo) {
        const end = new Date(filters.dateTo)
        end.setHours(23, 59, 59, 999)
        if (event.startTime > end) return false
      }
      if (filters.upcomingOnly && event.startTime < now) return false
      return true
    })
  }, [events, filters])

  return (
    <main>
      {/* View toggle */}
      <div className="flex justify-center pt-6">
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={18} />
            <span>List</span>
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapIcon size={18} />
            <span>Map</span>
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <p className="text-center text-xs text-gray-400 mb-1">
        {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
      </p>

      {view === "list" ? (
        <EventList events={filtered} savedIds={savedIds} />
      ) : (
        <EventMap events={filtered} />
      )}
    </main>
  )
}
