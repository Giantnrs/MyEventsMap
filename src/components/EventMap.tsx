"use client"
import { Event } from "@prisma/client"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import L from "leaflet"
import "leaflet.markercluster"

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Build the HTML for a cluster popup listing multiple events
function buildClusterPopupHtml(events: Event[]): string {
  const rows = events
    .map(
      (e) => {
        const label = e.startTime.toLocaleDateString("en-NZ", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        return `
          <a
            href="/events/${e.id}"
            data-event-id="${e.id}"
            class="cluster-popup-item"
            style="
              display:flex;flex-direction:column;gap:2px;
              padding:10px 12px;border-bottom:1px solid #f3f4f6;
              text-decoration:none;color:inherit;
              transition:background 0.12s;
            "
            onmouseenter="this.style.background='#eff6ff'"
            onmouseleave="this.style.background=''"
          >
            <span style="font-weight:600;font-size:13px;color:#111;line-height:1.3;">${e.title}</span>
            <span style="font-size:11px;color:#6b7280;">📍 ${e.location}</span>
            <span style="font-size:11px;color:#6b7280;">🕐 ${label}</span>
          </a>`
      }
    )
    .join("")

  return `
    <div style="
      width:260px;
      border-radius:12px;
      overflow:hidden;
      font-family:system-ui,sans-serif;
    ">
      <div style="
        padding:10px 12px 8px;
        background:#f9fafb;
        border-bottom:1px solid #e5e7eb;
        font-size:12px;font-weight:600;color:#6b7280;
        letter-spacing:0.04em;text-transform:uppercase;
      ">
        ${events.length} events here
      </div>
      <div style="max-height:280px;overflow-y:auto;">
        ${rows}
      </div>
    </div>`
}

export default function EventMap({ events }: { events: Event[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  // Keep a ref to the cluster group so we can replace it on filter change
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const router = useRouter()

  // Initialise the map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const defaultCenter: [number, number] = [51.505, -0.09]
    const map = L.map(mapRef.current).setView(defaultCenter, 13)
    mapInstanceRef.current = map

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
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
          width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          background:white;border:2px solid rgba(0,0,0,0.2);
          border-radius:4px;cursor:pointer;color:#444;
          box-shadow:none;padding:0;margin-top:48px;
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

    return () => {
      map.remove()
      mapInstanceRef.current = null
      clusterGroupRef.current = null
    }
  }, [])

  // Re-build markers whenever `events` changes (filters applied)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove previous cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current)
      clusterGroupRef.current = null
    }

    if (events.length === 0) return

    // Create a fresh cluster group
    const clusterGroup = (L as any).markerClusterGroup({
      // Tweak these to taste:
      maxClusterRadius: 60,         // px — how close markers must be to cluster
      spiderfyOnMaxZoom: false,     // we handle clusters ourselves
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,   // we show a popup instead of zooming
      iconCreateFunction(cluster: any) {
        const count = cluster.getChildCount()
        // Pick a size tier
        const size = count < 5 ? 36 : count < 15 ? 44 : 52
        const bg   = count < 5 ? "#2563eb" : count < 15 ? "#7c3aed" : "#dc2626"
        return L.divIcon({
          html: `
            <div style="
              width:${size}px;height:${size}px;
              background:${bg};
              border:3px solid white;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 8px rgba(0,0,0,0.25);
              color:white;font-weight:700;font-size:${size > 40 ? 14 : 12}px;
              font-family:system-ui,sans-serif;
            ">${count}</div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      },
    }) as L.MarkerClusterGroup

    // Handle cluster click → popup with event list
    clusterGroup.on("clusterclick", (e: any) => {
      const cluster = e.layer
      const childMarkers: L.Marker[] = cluster.getAllChildMarkers()
      // Retrieve the event attached to each marker
      const clusterEvents: Event[] = childMarkers
        .map((m: any) => m.options.eventData as Event)
        .filter(Boolean)

      if (clusterEvents.length === 0) return

      const popup = L.popup({
        maxWidth: 280,
        className: "cluster-list-popup",
      })
        .setLatLng(cluster.getLatLng())
        .setContent(buildClusterPopupHtml(clusterEvents))
        .openOn(map)

      // After popup opens, wire up link clicks to use Next.js router
      requestAnimationFrame(() => {
        const container = popup.getElement()
        if (!container) return
        container.querySelectorAll<HTMLAnchorElement>("[data-event-id]").forEach((a) => {
          a.addEventListener("click", (ev) => {
            ev.preventDefault()
            map.closePopup()
            router.push(a.getAttribute("href")!)
          })
        })
      })
    })

    // Add individual markers
    events.forEach((event) => {
      const startLabel = event.startTime.toLocaleDateString("en-NZ", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      const tooltip = L.tooltip({
        permanent: false,
        direction: "top",
        offset: [0, -42],
        opacity: 1,
        className: "event-map-tooltip",
      }).setContent(`
        <div style="width:200px;box-sizing:border-box;">
          <p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#111;white-space:normal;word-break:break-word;line-height:1.3;">${event.title}</p>
          <p style="font-size:11px;margin:0 0 2px;color:#555;white-space:normal;word-break:break-word;">📍 ${event.location}</p>
          <p style="font-size:11px;margin:0;color:#555;">🕐 ${startLabel}</p>
        </div>
      `)

      const marker = L.marker([event.lat, event.lng], {
        icon: defaultIcon,
        // Store the event on the marker options for retrieval in clusterclick
        ...(({ eventData: event } as any)),
      }).bindTooltip(tooltip)

      // Store event data on marker instance for clusterclick lookup
      ;(marker as any).options.eventData = event

      marker.on("click", () => router.push(`/events/${event.id}`))
      marker.on("mouseover", () => {
        const el = marker.getElement()
        if (el) el.style.cursor = "pointer"
      })

      clusterGroup.addLayer(marker)
    })

    map.addLayer(clusterGroup)
    clusterGroupRef.current = clusterGroup

    // Fit map to markers
    const bounds = clusterGroup.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
    }
  }, [events, router])

  return (
    <>
      <style>{`
        /* Single-marker tooltip */
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
        .leaflet-tooltip-top.event-map-tooltip::before {
          border-top-color: #e5e7eb !important;
        }

        /* Cluster popup wrapper */
        .cluster-list-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.14);
          border: 1px solid #e5e7eb;
        }
        .cluster-list-popup .leaflet-popup-content {
          margin: 0;
          width: 260px !important;
        }
        .cluster-list-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
      <div ref={mapRef} style={{ height: "calc(100vh - 64px)", width: "100%" }} />
    </>
  )
}
