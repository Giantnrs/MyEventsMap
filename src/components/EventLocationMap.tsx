'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function EventLocationMap({
  lat,
  lng,
  label,
}: {
  lat: number
  lng: number
  label: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    })
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    map.setView([lat, lng], 15)

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(label)
      .openPopup()

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, label])

  return (
    <div
      ref={containerRef}
      style={{ height: '280px', width: '100%' }}
      className="rounded-2xl overflow-hidden border border-gray-200 z-0"
    />
  )
}
