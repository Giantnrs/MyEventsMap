'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, LocateFixed, Loader2, MapPin, ChevronDown, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'

const CATEGORIES = [
  { value: 'OUTDOOR', label: '🌲 Outdoor' },
  { value: 'MUSIC',   label: '🎵 Music' },
  { value: 'SPORTS',  label: '⚽ Sports' },
  { value: 'FOOD',    label: '🍽️ Food' },
  { value: 'TECH',    label: '💻 Tech' },
  { value: 'ARTS',    label: '🎨 Arts' },
  { value: 'CHARITY', label: '❤️ Charity' },
  { value: 'OTHER',   label: '📌 Other' },
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

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}
function parseDate(s: string): Date | null {
  const d = new Date(s.slice(0, 10))
  return isNaN(d.getTime()) ? null : d
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function isBetween(d: Date, a: Date, b: Date) {
  const t = d.getTime(), lo = Math.min(a.getTime(), b.getTime()), hi = Math.max(a.getTime(), b.getTime())
  return t > lo && t < hi
}

function DateRangePicker({
  dateFrom, dateTo, onChange,
}: { dateFrom: string; dateTo: string; onChange: (from: string, to: string) => void }) {
  const now        = new Date()
  const [open, setOpen]     = useState(false)
  const [rect, setRect]     = useState<DOMRect | null>(null)
  const [month, setMonth]   = useState(now.getMonth())
  const [year,  setYear]    = useState(now.getFullYear())
  const [start, setStart]   = useState<Date | null>(parseDate(dateFrom))
  const [end,   setEnd]     = useState<Date | null>(parseDate(dateTo))
  const [hover, setHover]   = useState<Date | null>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sync when externally cleared
  useEffect(() => { setStart(parseDate(dateFrom)) }, [dateFrom])
  useEffect(() => { setEnd(parseDate(dateTo)) },     [dateTo])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current  && !btnRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function toggle() {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen(o => !o)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  function selectDay(d: Date) {
    if (!start || (start && end)) {
      // Start fresh
      setStart(d); setEnd(null)
    } else {
      // Second click — ensure start <= end
      if (d.getTime() < start.getTime()) { setEnd(start); setStart(d) }
      else { setEnd(d) }
    }
  }

  function apply() {
    if (start) onChange(`${toDateStr(start)}T00:00`, end ? `${toDateStr(end)}T23:59` : `${toDateStr(start)}T23:59`)
    setOpen(false)
  }

  function clear() {
    setStart(null); setEnd(null); setHover(null)
    onChange('', '')
    setOpen(false)
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function dayStyle(d: Date) {
    const isStart   = start && sameDay(d, start)
    const isEnd     = end   && sameDay(d, end)
    const rangeEnd  = end ?? (start && hover && !end ? hover : null)
    const inRange   = start && rangeEnd && isBetween(d, start, rangeEnd)
    const isToday   = sameDay(d, now)

    if (isStart || isEnd)  return 'bg-blue-600 text-white rounded-full font-semibold'
    if (inRange)           return 'bg-blue-100 text-blue-800 rounded-none'
    if (isToday)           return 'text-blue-600 font-semibold'
    return 'text-gray-700 hover:bg-gray-100 rounded-full'
  }

  const isActive = !!dateFrom || !!dateTo
  const fmt = (s: string) => s ? new Date(s).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' }) : '…'
  const label = isActive ? `${fmt(dateFrom)} – ${fmt(dateTo || dateFrom)}` : 'Date range'

  const panel = open && rect ? createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: rect.bottom + 6, left: rect.left, zIndex: 9999, width: 288 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 select-none"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = new Date(year, month, i + 1)
          return (
            <button
              key={i}
              type="button"
              onClick={() => selectDay(d)}
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
              className={`h-8 w-full text-sm transition-colors ${dayStyle(d)}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Hint + actions */}
      <p className="text-xs text-gray-400 text-center mt-3">
        {!start ? 'Click a start date' : !end ? 'Click an end date' : `${toDateStr(start)} – ${toDateStr(end)}`}
      </p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={apply}
          disabled={!start}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Apply
        </button>
        {(start || isActive) && (
          <button type="button" onClick={clear} className="px-3 py-2 border border-gray-300 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 border rounded-lg pl-3 pr-2.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <CalendarRange size={14} className={isActive ? 'text-blue-400' : 'text-gray-400'} />
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown size={14} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''} ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
      </button>
      {panel}
    </div>
  )
}

function CategoryDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function toggle() {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen(o => !o)
  }

  const selected = CATEGORIES.find(c => c.value === value)

  const menu = open && rect ? createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top:      rect.bottom + 6,
        left:     rect.left,
        width:    176,
        zIndex:   9999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => { onChange(''); setOpen(false) }}
        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
          !value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        All categories
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat.value}
          type="button"
          onClick={() => { onChange(cat.value); setOpen(false) }}
          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
            value === cat.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 border rounded-lg pl-3 pr-2.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          value
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span>{selected ? selected.label : 'All categories'}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''} ${value ? 'text-blue-400' : 'text-gray-400'}`}
        />
      </button>
      {menu}
    </div>
  )
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

      {/* Row 2 — category + dates + upcoming + near me */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Category selector — custom dropdown */}
        <CategoryDropdown
          value={filters.category}
          onChange={v => set({ category: v })}
        />

        <DateRangePicker
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onChange={(from, to) => set({ dateFrom: from, dateTo: to })}
        />

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