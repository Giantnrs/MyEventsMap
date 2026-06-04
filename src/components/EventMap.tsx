"use client"
import { Event } from "@prisma/client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import L from "leaflet"
import "leaflet.markercluster"

// ── Inline SVG icons used inside Leaflet tooltip strings ─────────────────────
// (Cannot use React components here — Leaflet templates are raw HTML strings)

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
const CLOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`

// ── Category emoji map ─────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  OUTDOOR: "🏔️",
  MUSIC:   "🎵",
  SPORTS:  "⚽",
  FOOD:    "🍽️",
  TECH:    "💻",
  ARTS:    "🎨",
  CHARITY: "❤️",
  OTHER:   "📌",
}

// ── Category badge colours used in the sidebar ─────────────────────────────
const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  OUTDOOR: { bg: "#dcfce7", color: "#166534" },
  MUSIC:   { bg: "#ede9fe", color: "#5b21b6" },
  SPORTS:  { bg: "#fef9c3", color: "#854d0e" },
  FOOD:    { bg: "#fce7f3", color: "#9d174d" },
  TECH:    { bg: "#dbeafe", color: "#1e40af" },
  ARTS:    { bg: "#fef3c7", color: "#92400e" },
  CHARITY: { bg: "#fee2e2", color: "#991b1b" },
  OTHER:   { bg: "#f3f4f6", color: "#374151" },
}

// ── Leaflet DivIcon: white circle with category emoji ─────────────────────
function categoryIcon(category: string): L.DivIcon {
  const emoji = CATEGORY_EMOJI[category] ?? "📌"
  return L.divIcon({
    html: `<div style="
      width:34px;height:34px;background:white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;line-height:1;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      border:2px solid white;cursor:pointer;
      transition:box-shadow 0.15s,transform 0.15s;">${emoji}</div>`,
    className: "",
    iconSize:      [34, 34],
    iconAnchor:    [17, 17],
    tooltipAnchor: [0, -20],
  })
}

// ── DOM-based cluster popup — never uses .innerHTML with user data ─────────
// Using createElement + .textContent prevents XSS from event titles/locations.
function buildClusterPopupEl(
  events: Event[],
  onNavigate: (href: string) => void,
): HTMLElement {
  const wrap = document.createElement("div")
  wrap.style.cssText =
    "width:260px;border-radius:12px;overflow:hidden;font-family:system-ui,sans-serif;"

  const header = document.createElement("div")
  header.style.cssText =
    "padding:10px 12px 8px;background:#f9fafb;border-bottom:1px solid #e5e7eb;" +
    "font-size:12px;font-weight:600;color:#6b7280;letter-spacing:0.04em;text-transform:uppercase;"
  header.textContent = `${events.length} event${events.length !== 1 ? "s" : ""} here`
  wrap.appendChild(header)

  const list = document.createElement("div")
  list.style.cssText = "max-height:280px;overflow-y:auto;"

  events.forEach((e) => {
    const label = e.startTime.toLocaleDateString("en-NZ", {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })

    const item = document.createElement("a")
    item.href = `/events/${e.id}`
    item.style.cssText =
      "display:flex;flex-direction:row;align-items:center;gap:10px;padding:8px 12px;" +
      "border-bottom:1px solid #f3f4f6;text-decoration:none;color:inherit;" +
      "transition:background 0.12s;cursor:pointer;"
    item.addEventListener("mouseenter", () => { item.style.background = "#eff6ff" })
    item.addEventListener("mouseleave", () => { item.style.background = "" })
    item.addEventListener("click", (ev) => {
      ev.preventDefault()
      onNavigate(`/events/${e.id}`)
    })

    // Thumbnail
    const thumb = document.createElement("div")
    thumb.style.cssText =
      "width:44px;height:44px;border-radius:6px;overflow:hidden;flex-shrink:0;background:#e5e7eb;"
    if (e.imageUrl) {
      const img = document.createElement("img")
      img.src = e.imageUrl
      img.alt = ""
      img.style.cssText = "width:100%;height:100%;object-fit:cover;"
      thumb.appendChild(img)
    }
    item.appendChild(thumb)

    // Text column — all content set via .textContent to prevent XSS
    const col = document.createElement("div")
    col.style.cssText = "display:flex;flex-direction:column;gap:2px;min-width:0;"

    const title = document.createElement("span")
    title.style.cssText =
      "font-weight:600;font-size:13px;color:#111;line-height:1.3;" +
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
    title.textContent = e.title

    const loc = document.createElement("span")
    loc.style.cssText = "display:flex;align-items:center;gap:3px;font-size:11px;color:#6b7280;"
    const locIcon = document.createElement("span")
    locIcon.innerHTML = PIN_SVG         // safe: static SVG string, no user data
    const locText = document.createElement("span")
    locText.textContent = e.location    // safe: .textContent, not .innerHTML
    loc.appendChild(locIcon)
    loc.appendChild(locText)

    const time = document.createElement("span")
    time.style.cssText = "display:flex;align-items:center;gap:3px;font-size:11px;color:#6b7280;"
    const timeIcon = document.createElement("span")
    timeIcon.innerHTML = CLOCK_SVG      // safe: static SVG string
    const timeText = document.createElement("span")
    timeText.textContent = label        // safe: .textContent
    time.appendChild(timeIcon)
    time.appendChild(timeText)

    col.appendChild(title)
    col.appendChild(loc)
    col.appendChild(time)
    item.appendChild(col)
    list.appendChild(item)
  })

  wrap.appendChild(list)
  return wrap
}

// ════════════════════════════════════════════════════════════════════════════
// EventMap component
// ════════════════════════════════════════════════════════════════════════════

export default function EventMap({
  events,
  flyTo,
  initialView,
}: {
  events: Event[]
  flyTo: { lat: number; lng: number } | null
  initialView?: { lat: number; lng: number; zoom: number }
}) {
  // ── Refs ──────────────────────────────────────────────────────────────────

  const mapRef          = useRef<HTMLDivElement>(null)
  const mapInstanceRef  = useRef<L.Map | null>(null)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)

  /** eventId → Leaflet marker, used for bi-directional hover highlighting */
  const markersMapRef   = useRef<Map<string, L.Marker>>(new Map())

  /** Always-current copy of the events prop, safe to read inside event handlers */
  const eventsRef       = useRef<Event[]>(events)

  /** Ref to each sidebar card DOM node, used to scroll into view on marker hover */
  const itemRefsMap     = useRef<Map<string, HTMLDivElement>>(new Map())

  const sidebarRef      = useRef<HTMLDivElement>(null)
  const router          = useRouter()

  // ── State ─────────────────────────────────────────────────────────────────

  /** Events whose lat/lng falls within the current Leaflet viewport */
  const [visibleEvents, setVisibleEvents] = useState<Event[]>(events)

  /** ID of the event currently highlighted via sidebar or marker hover */
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Keep eventsRef in sync on every render so closure-captured handlers
  // always see the latest events without re-registering listeners.
  eventsRef.current = events

  // ── Visible-event updater ─────────────────────────────────────────────────

  /**
   * Reads the current map bounds and filters the events list to those
   * whose coordinates fall within the viewport. Called on moveend/zoomend
   * and after markers are rebuilt.
   */
  function updateVisibleEvents() {
    const map = mapInstanceRef.current
    if (!map) return
    try {
      const bounds = map.getBounds()
      if (!bounds.isValid()) return
      const visible = eventsRef.current.filter((e) =>
        bounds.contains([e.lat, e.lng])
      )
      setVisibleEvents(visible)
    } catch {
      // Map may not be fully initialised yet; silently ignore
    }
  }

  // ── Marker highlight helpers (sidebar ↔ map bi-directional) ───────────────

  /**
   * Scales up the marker icon and adds a blue ring around it.
   * Called when the user hovers a sidebar card.
   */
  function highlightMarker(eventId: string) {
    const marker = markersMapRef.current.get(eventId)
    if (!marker) return
    const el = marker.getElement()
    if (!el) return
    const inner = el.querySelector("div") as HTMLElement | null
    if (inner) {
      inner.style.boxShadow = "0 0 0 3px #2563eb, 0 4px 12px rgba(0,0,0,0.35)"
      inner.style.transform = "scale(1.2)"
      inner.style.transition = "box-shadow 0.15s, transform 0.15s"
      inner.style.zIndex    = "1000"
    }
  }

  /**
   * Restores the marker icon to its default appearance.
   * Called when hover ends on a sidebar card.
   */
  function resetMarker(eventId: string) {
    const marker = markersMapRef.current.get(eventId)
    if (!marker) return
    const el = marker.getElement()
    if (!el) return
    const inner = el.querySelector("div") as HTMLElement | null
    if (inner) {
      inner.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)"
      inner.style.transform = ""
      inner.style.zIndex    = ""
    }
  }

  // ── Map initialisation (runs once) ────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initCenter: L.LatLngExpression = initialView
      ? [initialView.lat, initialView.lng]
      : [-37.787, 175.279]
    const initZoom = initialView?.zoom ?? 12

    const map = L.map(mapRef.current).setView(initCenter, initZoom)
    mapInstanceRef.current = map

    // Carto Voyager tile layer — clean, modern basemap, no API key needed
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map)

    map.on("moveend", updateVisibleEvents)
    map.on("zoomend", updateVisibleEvents)

    // ── Custom "Locate me" control ─────────────────────────────────────────
    let userMarker: L.CircleMarker | null = null
    let userCircle:  L.Circle       | null = null

    const LocateControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const btn = L.DomUtil.create("button", "leaflet-locate-btn")
        btn.title = "Go to my location"
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="2"  y1="12" x2="6"  y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>`
        btn.style.cssText = `
          width:36px;height:36px;display:flex;align-items:center;
          justify-content:center;background:white;
          border:2px solid rgba(0,0,0,0.2);border-radius:4px;
          cursor:pointer;color:#444;padding:0;margin-top:48px;`
        btn.onmouseenter = () => { btn.style.color = "#2563eb" }
        btn.onmouseleave = () => { btn.style.color = "#444" }
        L.DomEvent.disableClickPropagation(btn)

        btn.onclick = () => {
          if (!navigator.geolocation) {
            alert("Geolocation not supported.")
            return
          }
          btn.style.color = "#2563eb"
          btn.style.opacity = "0.6"

          navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude, accuracy } }) => {
              userMarker?.remove()
              userCircle?.remove()
              userCircle = L.circle([latitude, longitude], {
                radius: accuracy, color: "#3b82f6",
                fillColor: "#3b82f6", fillOpacity: 0.15, weight: 1,
              }).addTo(map)
              userMarker = L.circleMarker([latitude, longitude], {
                radius: 8, color: "#ffffff", weight: 2,
                fillColor: "#3b82f6", fillOpacity: 1,
              }).addTo(map).bindPopup("You are here").openPopup()
              map.flyTo([latitude, longitude], 15, { animate: true, duration: 1.2 })
              btn.style.color   = "#2563eb"
              btn.style.opacity = "1"
            },
            () => {
              alert("Unable to retrieve your location.")
              btn.style.color   = "#444"
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
      mapInstanceRef.current  = null
      clusterGroupRef.current = null
      markersMapRef.current.clear()
    }
  }, [])

  // ── Fly to "Near me" location ─────────────────────────────────────────────

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !flyTo) return
    map.flyTo([flyTo.lat, flyTo.lng], 13, { animate: true, duration: 1.2 })
  }, [flyTo])

  // ── Rebuild markers whenever the filtered event list changes ──────────────

  // Snapshot current map position into the URL before navigating away.
  // Uses replaceState (synchronous) so router.push sees the updated URL in history.
  function saveMapPosition(map: L.Map) {
    const c = map.getCenter()
    const params = new URLSearchParams(window.location.search)
    params.set("mlat",  c.lat.toFixed(5))
    params.set("mlng",  c.lng.toFixed(5))
    params.set("mzoom", String(map.getZoom()))
    window.history.replaceState(null, "", `?${params.toString()}`)
  }

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Tear down the previous cluster group and clear marker references
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current)
      clusterGroupRef.current = null
    }
    markersMapRef.current.clear()

    if (events.length === 0) {
      setVisibleEvents([])
      return
    }

    // ── Cluster group with colour-coded bubble icons ───────────────────────
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      iconCreateFunction(cluster: any) {
        const count = cluster.getChildCount()
        const size  = count < 5 ? 36 : count < 15 ? 44 : 52
        const bg    = count < 5 ? "#2563eb" : count < 15 ? "#7c3aed" : "#dc2626"
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;background:${bg};
            border:3px solid white;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            color:white;font-weight:700;font-size:${size > 40 ? 14 : 12}px;
            font-family:system-ui,sans-serif;">${count}</div>`,
          className: "",
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      },
    }) as L.MarkerClusterGroup

    // Cluster click → DOM-built popup (XSS-safe; see buildClusterPopupEl)
    clusterGroup.on("clusterclick", (e: any) => {
      const clusterEvents: Event[] = e.layer
        .getAllChildMarkers()
        .map((m: any) => m.options.eventData as Event)
        .filter(Boolean)

      if (clusterEvents.length === 0) return

      const content = buildClusterPopupEl(clusterEvents, (href) => {
        map.closePopup()
        saveMapPosition(map)
        router.push(href)
      })

      L.popup({ maxWidth: 280, className: "cluster-list-popup" })
        .setLatLng(e.layer.getLatLng())
        .setContent(content)
        .openOn(map)
    })

    // ── Individual markers ─────────────────────────────────────────────────
    events.forEach((event) => {
      const startLabel = event.startTime.toLocaleDateString("en-NZ", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })

      const marker = L.marker([event.lat, event.lng], {
        icon: categoryIcon(event.category),
      }).bindTooltip(
        L.tooltip({
          permanent: false, direction: "top",
          offset: [0, -4], opacity: 1,
          className: "event-map-tooltip",
        }).setContent(`
          <div style="width:200px;box-sizing:border-box;">
            <p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#111;
              white-space:normal;word-break:break-word;line-height:1.3;">${event.title}</p>
            <p style="font-size:11px;margin:0 0 2px;color:#555;display:flex;
              align-items:center;gap:3px;white-space:normal;word-break:break-word;">
              ${PIN_SVG} ${event.location}</p>
            <p style="font-size:11px;margin:0;color:#555;display:flex;
              align-items:center;gap:3px;">
              ${CLOCK_SVG} ${startLabel}</p>
          </div>`)
      )

      // Store event data so the cluster popup can access it
      ;(marker as any).options.eventData = event

      marker.on("click", () => { saveMapPosition(map); router.push(`/events/${event.id}`) })

      // On marker hover: highlight sidebar card and scroll it into view
      marker.on("mouseover", () => {
        const el = marker.getElement()
        if (el) el.style.cursor = "pointer"
        setHoveredId(event.id)
        const card = itemRefsMap.current.get(event.id)
        card?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      })
      marker.on("mouseout", () => {
        setHoveredId(null)
      })

      markersMapRef.current.set(event.id, marker)
      clusterGroup.addLayer(marker)
    })

    map.addLayer(clusterGroup)
    clusterGroupRef.current = clusterGroup

    // Fit bounds only on first load with no saved position
    if (!flyTo && !initialView) {
      const bounds = clusterGroup.getBounds()
      if (bounds.isValid()) {
        // fitBounds triggers 'moveend', which calls updateVisibleEvents
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
      }
    } else {
      // Saved position or flyTo already set — just update the sidebar
      setTimeout(updateVisibleEvents, 300)
    }
  }, [events, router]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sidebar event handlers ────────────────────────────────────────────────

  /** Highlight the corresponding map marker when hovering a sidebar card */
  function handleCardEnter(event: Event) {
    setHoveredId(event.id)
    highlightMarker(event.id)
  }

  /** Restore the marker when the sidebar card is no longer hovered */
  function handleCardLeave(event: Event) {
    setHoveredId(null)
    resetMarker(event.id)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        /* Leaflet tooltip */
        .event-map-tooltip {
          background: white; border: 1px solid #e5e7eb;
          border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          padding: 8px 12px; width: 224px; max-width: 224px;
          white-space: normal; overflow: hidden; box-sizing: border-box;
        }
        .leaflet-tooltip-top.event-map-tooltip::before {
          border-top-color: #e5e7eb !important;
        }

        /* Cluster popup */
        .cluster-list-popup .leaflet-popup-content-wrapper {
          padding: 0; border-radius: 12px; overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.14); border: 1px solid #e5e7eb;
        }
        .cluster-list-popup .leaflet-popup-content {
          margin: 0; width: 260px !important;
        }
        .cluster-list-popup .leaflet-popup-tip { background: white; }

        /* Hide sidebar on very narrow screens so map stays usable */
        @media (max-width: 640px) {
          .map-sidebar { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div
          ref={sidebarRef}
          className="map-sidebar"
          style={{
            width: "346px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            background: "white",
            borderRight: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div style={{
            padding: "11px 14px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""} in view
            </span>
          </div>

          {/* Scrollable event list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {visibleEvents.length === 0 ? (
              <div style={{
                padding: "40px 16px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "13px",
                lineHeight: "1.5",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🗺️</div>
                No events visible here.
                <br />
                Try panning or zooming out.
              </div>
            ) : (
              visibleEvents.map((event) => {
                const cat   = CATEGORY_STYLE[event.category] ?? CATEGORY_STYLE.OTHER
                const emoji = CATEGORY_EMOJI[event.category] ?? "📌"
                const isHovered = hoveredId === event.id

                const dateStr = event.startTime.toLocaleDateString("en-NZ", {
                  month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })

                return (
                  <div
                    key={event.id}
                    ref={(el) => {
                      // Track DOM nodes for scrollIntoView on marker hover
                      if (el) itemRefsMap.current.set(event.id, el)
                      else    itemRefsMap.current.delete(event.id)
                    }}
                    onClick={() => { const m = mapInstanceRef.current; if (m) saveMapPosition(m); router.push(`/events/${event.id}`) }}
                    onMouseEnter={() => handleCardEnter(event)}
                    onMouseLeave={() => handleCardLeave(event)}
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "10px 12px",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                      background: isHovered ? "#eff6ff" : "white",
                      borderLeft: isHovered ? "3px solid #2563eb" : "3px solid transparent",
                      transition: "background 0.12s, border-left-color 0.12s",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: "22px", lineHeight: 1 }}>{emoji}</span>
                      )}
                    </div>

                    {/* Text content */}
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}>
                      {/* Category badge */}
                      <span style={{
                        alignSelf: "flex-start",
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: cat.bg,
                        color: cat.color,
                        lineHeight: "1.6",
                      }}>
                        {event.category}
                      </span>

                      {/* Title — clamps to 2 lines */}
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#111827",
                        lineHeight: "1.3",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {event.title}
                      </span>

                      {/* Location */}
                      <span style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        📍 {event.location}
                      </span>

                      {/* Date */}
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        🕐 {dateStr}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Leaflet map ─────────────────────────────────────────────────── */}
        <div
          ref={mapRef}
          style={{ flex: 1, height: "100%" }}
        />
      </div>
    </>
  )
}