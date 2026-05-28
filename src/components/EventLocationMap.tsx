'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'


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

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map)

    map.setView([lat, lng], 15)

    L.circleMarker([lat, lng], {
      radius: 8, color: "#ffffff", weight: 2.5,
      fillColor: "#2563eb", fillOpacity: 1,
    })
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
