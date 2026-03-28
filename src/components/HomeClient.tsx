"use client"
import { Event } from "@prisma/client"
import { useState } from "react"
import { List, Map as MapIcon } from "lucide-react"
import EventList from "@/components/EventList"
import dynamic from "next/dynamic"

const EventMap = dynamic(() => import("@/components/EventMap"), {
  ssr: false,
  loading: () => <p className="p-6 text-gray-500">Loading map...</p>,
})

export default function HomeClient({ events }: { events: Event[] }) {
  const [view, setView] = useState<"list" | "map">("list")

  return (
    <main>
      {/* View toggle */}
      <div className="flex justify-center pt-6">
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={18} />
            <span>List</span>
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'map'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapIcon size={18} />
            <span>Map</span>
          </button>
        </div>
      </div>

      {view === "list" ? (
        <EventList events={events} />
      ) : (
        <EventMap events={events} />
      )}
    </main>
  )
}