"use client"
import { Event } from "@prisma/client"
import { useState } from "react"
import Navbar from "./Navbar"
import EventList from "@/components/EventList"
import dynamic from "next/dynamic"

const EventMap = dynamic(() => import("@/components/EventMap"), {
  ssr: false,
  loading: () => <p className="p-6 text-gray-500">Loading map...</p>,
})
export default function HomeClient({ events }: { events:Event[] }) {
  const [view, setView] = useState<"list" | "map">("list")

  return (
    <main>
      <Navbar view={view} setView={setView} />

      {view === "list" ? (
        <EventList events={events} />
      ) : (
        <EventMap events={events} />
      )}
    </main>
  )
}