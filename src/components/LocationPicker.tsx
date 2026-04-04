'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, MapPin } from 'lucide-react'

interface Suggestion {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
}

interface Props {
  defaultLocation?: string
  defaultLat?: number
  defaultLng?: number
}

export default function LocationPicker({ defaultLocation = '', defaultLat, defaultLng }: Props) {
  const [query, setQuery] = useState(defaultLocation)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [lat, setLat] = useState<number | ''>(defaultLat ?? '')
  const [lng, setLng] = useState<number | ''>(defaultLng ?? '')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchSuggestions(value: string) {
    if (!value.trim() || value.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&autocomplete=true&limit=5&language=en`
      const res = await fetch(url)
      const data = await res.json()
      setSuggestions(data.features ?? [])
      setOpen(true)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    // Clear coords when user edits the field manually
    setLat('')
    setLng('')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300)
  }

  function handleSelect(suggestion: Suggestion) {
    setQuery(suggestion.place_name)
    setLng(suggestion.center[0])
    setLat(suggestion.center[1])
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Location input with autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <div ref={containerRef} className="relative">
          <input
            name="location"
            type="text"
            required
            autoComplete="off"
            placeholder="e.g. Sky Tower, Auckland"
            value={query}
            onChange={handleInput}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Loading spinner */}
          {loading && (
            <Loader2 size={16} className="absolute right-3 top-3 text-gray-400 animate-spin" />
          )}

          {/* Dropdown */}
          {open && suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {suggestions.map(s => (
                <li
                  key={s.id}
                  onMouseDown={() => handleSelect(s)}
                  className="flex items-start gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-blue-500" />
                  <span>{s.place_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Lat / Lng — auto-filled, but still editable as fallback */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
            {lat === '' && (
              <span className="ml-1 text-xs text-amber-500 font-normal">pick a suggestion above</span>
            )}
          </label>
          <input
            name="lat"
            type="number"
            step="any"
            required
            value={lat}
            onChange={e => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))}
            placeholder="-36.8485"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            name="lng"
            type="number"
            step="any"
            required
            value={lng}
            onChange={e => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))}
            placeholder="174.7633"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>
      </div>
    </div>
  )
}
