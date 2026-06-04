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

const MAPBOX_TOKEN = () => process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
const DEFAULT_CENTER: [number, number] = [-37.787, 175.279] // Hamilton, NZ
const DEFAULT_ZOOM = 12

export default function LocationPicker({ defaultLocation = '', defaultLat, defaultLng }: Props) {
  const [query, setQuery]           = useState(defaultLocation)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [lat, setLat]               = useState<number | ''>(defaultLat ?? '')
  const [lng, setLng]               = useState<number | ''>(defaultLng ?? '')
  const [loading, setLoading]       = useState(false)
  const [open, setOpen]             = useState(false)
  const [geocoding, setGeocoding]   = useState(false)

  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapDivRef      = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)       // L.Map
  const markerRef      = useRef<any>(null)       // L.Marker

  // ── Close autocomplete on outside click ──────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ── Initialise Leaflet map ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current) return
    let cancelled = false

    import('leaflet').then(L => {
      // Guard against StrictMode double-invoke or already-init container
      if (cancelled || !mapDivRef.current) return
      if ((mapDivRef.current as any)._leaflet_id) return

      const initialCenter: [number, number] =
        defaultLat != null && defaultLng != null
          ? [defaultLat, defaultLng]
          : DEFAULT_CENTER

      const map = L.map(mapDivRef.current, {
        center: initialCenter,
        zoom:   defaultLat != null ? 15 : DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(map)

      // If editing with existing coords, show the pin immediately
      if (defaultLat != null && defaultLng != null) {
        markerRef.current = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng()
          setLat(pos.lat)
          setLng(pos.lng)
          reverseGeocode(pos.lat, pos.lng)
        })
      }

      // Click to place / move pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        placePinAt(map, L, lat, lng)
        setLat(lat)
        setLng(lng)
        reverseGeocode(lat, lng)
      })

      mapRef.current = map
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Place / move the draggable marker ────────────────────────────────────
  function placePinAt(map: any, L: any, latVal: number, lngVal: number) {
    if (markerRef.current) {
      markerRef.current.setLatLng([latVal, lngVal])
    } else {
      markerRef.current = L.marker([latVal, lngVal], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng()
        setLat(pos.lat)
        setLng(pos.lng)
        reverseGeocode(pos.lat, pos.lng)
      })
    }
  }

  // ── Reverse geocode lat/lng → place name ──────────────────────────────────
  async function reverseGeocode(latVal: number, lngVal: number) {
    const token = MAPBOX_TOKEN()
    if (!token) return
    setGeocoding(true)
    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngVal},${latVal}.json` +
        `?access_token=${token}&limit=1&language=en`
      const res  = await fetch(url)
      const data = await res.json()
      const name = data.features?.[0]?.place_name
      if (name) setQuery(name)
    } catch { /* keep existing query */ }
    finally { setGeocoding(false) }
  }

  // ── Autocomplete forward geocoding ───────────────────────────────────────
  async function fetchSuggestions(value: string) {
    if (!value.trim() || value.length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const token = MAPBOX_TOKEN()
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json` +
        `?access_token=${token}&autocomplete=true&limit=5&language=en`
      const data = await (await fetch(url)).json()
      setSuggestions(data.features ?? [])
      setOpen(true)
    } catch { setSuggestions([]) }
    finally { setLoading(false) }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    setLat(''); setLng('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300)
  }

  function handleSelect(s: Suggestion) {
    setQuery(s.place_name)
    setLng(s.center[0])
    setLat(s.center[1])
    setSuggestions([])
    setOpen(false)

    // Fly map to selected location and place pin
    if (mapRef.current) {
      import('leaflet').then(L => {
        mapRef.current.flyTo([s.center[1], s.center[0]], 15, { duration: 0.8 })
        placePinAt(mapRef.current, L, s.center[1], s.center[0])
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Text search with autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <div ref={containerRef} className="relative">
          <input
            name="location"
            type="text"
            required
            autoComplete="off"
            placeholder="Search or click the map to pin a location"
            value={query}
            onChange={handleInput}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(loading || geocoding) && (
            <Loader2 size={16} className="absolute right-3 top-3 text-gray-400 animate-spin" />
          )}
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

      {/* Interactive map */}
      <div
        ref={mapDivRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200 z-0"
        style={{ height: 260 }}
      />

      {lat === '' && (
        <p className="text-xs text-amber-500 flex items-center gap-1">
          <MapPin size={12} />
          Click the map or pick a search result to set the pin
        </p>
      )}

      {/* Hidden lat / lng passed to form */}
      <input type="hidden" name="lat" value={lat} required />
      <input type="hidden" name="lng" value={lng} required />
    </div>
  )
}
