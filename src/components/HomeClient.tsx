"use client"
import { Event } from "@prisma/client"
import { useState, useMemo } from "react"
import { List, Map as MapIcon, Search, X } from "lucide-react"
import EventList from "@/components/EventList"
import FilterBar, { Filters, DEFAULT_FILTERS } from "@/components/FilterBar"
import dynamic from "next/dynamic"

const EventMap = dynamic(() => import("@/components/EventMap"), {
  ssr: false,
  loading: () => <p className="p-6 text-gray-500">Loading map...</p>,
})

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function HomeClient({
  events,
  savedIds,
}: {
  events: Event[]
  savedIds: string[]
}) {
  const [view, setView]           = useState<"list" | "map">("list")
  const [filters, setFilters]     = useState<Filters>(DEFAULT_FILTERS)
  const [searchOpen, setSearchOpen] = useState(false)

  const isFiltering =
    filters.search ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.upcomingOnly ||
    filters.nearLat !== null

  function handleToggleSearch() {
    if (searchOpen && isFiltering) setFilters(DEFAULT_FILTERS)
    setSearchOpen(prev => !prev)
  }

  const filtered = useMemo(() => {
    const now    = new Date()
    const search = filters.search.toLowerCase()

    return events.filter(event => {
      if (search && !event.title.toLowerCase().includes(search) && !event.location.toLowerCase().includes(search))
        return false
      if (filters.category && event.category !== filters.category) return false
      if (filters.dateFrom && event.startTime < new Date(filters.dateFrom)) return false
      if (filters.dateTo) {
        const end = new Date(filters.dateTo)
        end.setHours(23, 59, 59, 999)
        if (event.startTime > end) return false
      }
      if (filters.upcomingOnly && event.startTime < now) return false
      if (
        filters.nearLat !== null &&
        filters.nearLng !== null &&
        haversineKm(filters.nearLat, filters.nearLng, event.lat, event.lng) > filters.radiusKm
      ) return false
      return true
    })
  }, [events, filters])

  // Memoized so EventMap's flyTo effect only fires when coords actually change,
  // not on every render (which would cause the map to jump on every filter tweak)
  const flyTo = useMemo(
    () => filters.nearLat !== null
      ? { lat: filters.nearLat, lng: filters.nearLng! }
      : null,
    [filters.nearLat, filters.nearLng]
  )

  return (
    <main>
      {/* View toggle + search button */}
      <div className="flex justify-center items-center gap-2 pt-6">
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <List size={18} />
            <span>List</span>
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "map" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MapIcon size={18} />
            <span>Map</span>
          </button>
        </div>

        <button
          onClick={handleToggleSearch}
          title={searchOpen ? "Close search" : "Search & filter"}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
            searchOpen || isFiltering
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-gray-100 text-gray-500 border-gray-200 hover:text-gray-700 hover:bg-gray-200"
          }`}
        >
          {searchOpen ? (
            <X size={17} />
          ) : (
            <span className="relative">
              <Search size={17} />
              {isFiltering && (
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-blue-400 rounded-full border border-white" />
              )}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible filter bar */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          searchOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <p className="text-center text-xs text-gray-400 mb-1 mt-2">
        {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
      </p>

      {view === "list" ? (
        <EventList events={filtered} savedIds={savedIds} />
      ) : (
        <EventMap events={filtered} flyTo={flyTo} />
      )}
    </main>
  )
}