'use client'

import { X } from 'lucide-react'

const CATEGORIES = [
  'OUTDOOR', 'MUSIC', 'SPORTS', 'FOOD', 'TECH', 'ARTS', 'CHARITY', 'OTHER',
]

export interface Filters {
  search: string
  category: string
  dateFrom: string
  dateTo: string
  upcomingOnly: boolean
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  upcomingOnly: false,
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function FilterBar({ filters, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const isActive =
    filters.search ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.upcomingOnly

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-2 flex flex-col gap-3">

      {/* Row 1 — search + clear */}
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

      {/* Row 2 — category, dates, upcoming toggle */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Category */}
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

        {/* Date from */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => set({ dateFrom: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => set({ dateTo: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Upcoming only toggle */}
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
      </div>
    </div>
  )
}
