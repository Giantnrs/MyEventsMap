"use client"
import { Event } from "@prisma/client"
import { useEffect, useRef } from "react"
import L from "leaflet"

// Fix Leaflet's broken default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function EventMap({ events }: { events: Event[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map centered on first event or a default location
    const center = events.length > 0
      ? [events[0].lat, events[0].lng] as [number, number]
      : [51.505, -0.09] as [number, number]

    const map = L.map(mapRef.current).setView(center, 13)
    mapInstanceRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Add a marker for each event
    events.forEach((event) => {
      L.marker([event.lat, event.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`<strong>${event.title}</strong><br/>${event.description ?? ""}`)
    })

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [events])

  return (
    <div
      ref={mapRef}
      style={{ height: "calc(100vh - 64px)", width: "100%" }}
    />
  )
}