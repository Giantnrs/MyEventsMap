"use client"
import { Event } from "@prisma/client"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()

  useEffect(() => {
    if (!mapRef.current) return

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
        options: { position: "topleft" },
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
            margin-top: 48px;
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

    // Remove existing event markers (keep tile layer + user location markers)
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    if (events.length > 0) {
      map.setView([events[0].lat, events[0].lng], 13)

      events.forEach(event => {
        const startLabel = event.startTime.toLocaleDateString('en-NZ', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        // Hover tooltip (opens on mouseover, closes on mouseout)
        const tooltip = L.tooltip({
          permanent: false,
          direction: 'top',
          offset: [0, -42],
          opacity: 1,
          className: 'event-map-tooltip',
        }).setContent(`
          <div style="width:200px;box-sizing:border-box;">
            <p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#111;white-space:normal;word-break:break-word;line-height:1.3;">${event.title}</p>
            <p style="font-size:11px;margin:0 0 2px;color:#555;white-space:normal;word-break:break-word;">📍 ${event.location}</p>
            <p style="font-size:11px;margin:0;color:#555;">🕐 ${startLabel}</p>
          </div>
        `)

        const marker = L.marker([event.lat, event.lng], { icon: defaultIcon })
          .addTo(map)
          .bindTooltip(tooltip)

        // Click → navigate to event page
        marker.on('click', () => {
          router.push(`/events/${event.id}`)
        })

        // Cursor pointer on hover
        marker.on('mouseover', () => {
          const el = marker.getElement()
          if (el) el.style.cursor = 'pointer'
        })
      })
    }
  }, [events, router])

  return (
    <>
      <style>{`
        .event-map-tooltip {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          padding: 8px 12px;
          width: 224px;
          max-width: 224px;
          white-space: normal;
          overflow: hidden;
          box-sizing: border-box;
        }
        .event-map-tooltip::before {
          border-top-color: #e5e7eb !important;
        }
        .leaflet-tooltip-top.event-map-tooltip::before {
          border-top-color: #e5e7eb !important;
        }
      `}</style>
      <div ref={mapRef} style={{ height: "calc(100vh - 64px)", width: "100%" }} />
    </>
  )
}