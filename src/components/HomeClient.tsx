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

export default function HomeClient({ events }: { events: Event[] }) {
  const [view, setView] = useState<"list" | "map">("list")
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    const now = new Date()
    const search = filters.search.toLowerCase()

    return events.filter(event => {
      // Text search — title or location
      if (search && !event.title.toLowerCase().includes(search) && !event.location.toLowerCase().includes(search)) {
        return false
      }

      // Category
      if (filters.category && event.category !== filters.category) {
        return false
      }

      // Date from
      if (filters.dateFrom && event.startTime < new Date(filters.dateFrom)) {
        return false
      }

      // Date to — include the full "to" day by going to end of that day
      if (filters.dateTo) {
        const end = new Date(filters.dateTo)
        end.setHours(23, 59, 59, 999)
        if (event.startTime > end) return false
      }

      // Upcoming only
      if (filters.upcomingOnly && event.startTime < now) {
        return false
      }

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
              view === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={18} />
            <span>List</span>
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'map'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapIcon size={18} />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Filter bar — always visible */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Result count */}
      <p className="text-center text-xs text-gray-400 mb-1">
        {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
      </p>

      {view === "list" ? (
        <EventList events={filtered} />
      ) : (
        <EventMap events={filtered} />
      )}
    </main>
  )
}
