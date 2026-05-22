'use client'

import { useState } from 'react'
import { X, LocateFixed, Loader2, MapPin } from 'lucide-react'

const CATEGORIES = [
  'OUTDOOR', 'MUSIC', 'SPORTS', 'FOOD', 'TECH', 'ARTS', 'CHARITY', 'OTHER',
]

const RADIUS_OPTIONS = [
  { label: '2 km',  value: 2 },
  { label: '5 km',  value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
]

export interface Filters {
  search: string
  category: string
  dateFrom: string
  dateTo: string
  upcomingOnly: boolean
  nearLat: number | null
  nearLng: number | null
  radiusKm: number
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  upcomingOnly: false,
  nearLat: null,
  nearLng: null,
  radiusKm: 10,
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function FilterBar({ filters, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  const isActive =
    filters.search ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.upcomingOnly ||
    filters.nearLat !== null

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser.')
      return
    }
    setLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        set({ nearLat: coords.latitude, nearLng: coords.longitude })
        setLocating(false)
      },
      () => {
        setLocError('Could not get your location. Check browser permissions.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function clearLocation() {
    set({ nearLat: null, nearLng: null })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-2 flex flex-col gap-3">

      {/* Row 1 — keyword search + clear */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by title or location…"
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isActive && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-500 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Row 2 — category, dates, upcoming, near me */}
      <div className="flex flex-wrap gap-2 items-center">

        <select
          value={filters.category}
          onChange={e => set({ category: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input
            type="datetime-local"
            value={filters.dateFrom}
            onChange={e => set({ dateFrom: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input
            type="datetime-local"
            value={filters.dateTo}
            onChange={e => set({ dateTo: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => set({ upcomingOnly: !filters.upcomingOnly })}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            filters.upcomingOnly
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Upcoming only
        </button>

        {/* Near me button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
            filters.nearLat !== null
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          {locating
            ? <Loader2 size={14} className="animate-spin" />
            : <LocateFixed size={14} />
          }
          {locating ? 'Locating…' : 'Near me'}
        </button>

        {/* Radius selector — only when location is active */}
        {filters.nearLat !== null && (
          <select
            value={filters.radiusKm}
            onChange={e => set({ radiusKm: Number(e.target.value) })}
            className="border border-blue-300 rounded-lg px-3 py-2 text-sm bg-blue-50 text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {RADIUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Active location pill with clear */}
        {filters.nearLat !== null && (
          <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">
            <MapPin size={12} className="shrink-0" />
            <span>My location · {filters.radiusKm} km</span>
            <button
              onClick={clearLocation}
              className="ml-1 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      {locError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X size={12} /> {locError}
        </p>
      )}
    </div>
  )
}