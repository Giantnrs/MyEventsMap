"use client"
import { Event } from "@prisma/client"
import { useEffect, useRef } from "react"
import L from "leaflet"

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
    if (!mapRef.current) return

    // Only initialize the map once
    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = [51.505, -0.09]
      const map = L.map(mapRef.current).setView(defaultCenter, 13)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      // --- Locate control ---
      let userMarker: L.CircleMarker | null = null
      let userCircle: L.Circle | null = null

      const LocateControl = L.Control.extend({
        options: { position: "topleft" }, // <-- Move to top left
        onAdd() {
          const btn = L.DomUtil.create("button", "leaflet-locate-btn")
          btn.title = "Go to my location"
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>`

          btn.style.cssText = `
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            background: white; border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px; cursor: pointer; color: #444;
            box-shadow: none; padding: 0;
            margin-top: 48px; /* Add margin to move below zoom controls */
          `

          btn.onmouseenter = () => { btn.style.color = "#2563eb" }
          btn.onmouseleave = () => { btn.style.color = "#444" }

          L.DomEvent.disableClickPropagation(btn)

          btn.onclick = () => {
            if (!navigator.geolocation) {
              alert("Geolocation is not supported by your browser.")
              return
            }

            btn.style.color = "#2563eb"
            btn.style.opacity = "0.6"

            navigator.geolocation.getCurrentPosition(
              ({ coords }) => {
                const { latitude, longitude, accuracy } = coords

                userMarker?.remove()
                userCircle?.remove()

                userCircle = L.circle([latitude, longitude], {
                  radius: accuracy,
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.15,
                  weight: 1,
                }).addTo(map)

                userMarker = L.circleMarker([latitude, longitude], {
                  radius: 8,
                  color: "#ffffff",
                  weight: 2,
                  fillColor: "#3b82f6",
                  fillOpacity: 1,
                }).addTo(map).bindPopup("📍 You are here").openPopup()

                map.flyTo([latitude, longitude], 15, { animate: true, duration: 1.2 })

                btn.style.color = "#2563eb"
                btn.style.opacity = "1"
              },
              () => {
                alert("Unable to retrieve your location. Please check your browser permissions.")
                btn.style.color = "#444"
                btn.style.opacity = "1"
              },
              { enableHighAccuracy: true, timeout: 10000 }
            )
          }

          return btn
        },
      })

      new LocateControl().addTo(map)
    }

    const map = mapInstanceRef.current

    // Remove existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker || layer instanceof L.Circle) {
        map.removeLayer(layer)
      }
    })

    // Add tile layer again if needed (skip if already present)
    // Add event markers if there are any
    if (events.length > 0) {
      const center: [number, number] = [events[0].lat, events[0].lng]
      map.setView(center, 13)
      events.forEach(event => {
        L.marker([event.lat, event.lng], { icon: defaultIcon })
          .addTo(map)
          .bindPopup(`<strong>${event.title}</strong><br/>${event.description ?? ""}`)
      })
    }
    // If events.length === 0, do not move the map

    return () => {
      // Clean up only on unmount
      // Do not remove the map on every events change
    }
  }, [events])

  return (
    <div ref={mapRef} style={{ height: "calc(100vh - 64px)", width: "100%" }} />
  )
}