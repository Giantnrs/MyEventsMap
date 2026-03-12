"use client"
import { Event } from "@prisma/client"
import { useState } from "react"
import Navbar from "./Navbar"
import EventList from "./EventList"
import EventMap from "./EventMap"

export default function HomeClient({ events }: { events: Event[] }) {
  const [view, setView] = useState<"list" | "map">("list")

  return (
    <main className="p-8">
      <Navbar view={view} setView={setView} />

      {view === "list" ? (
        <EventList events={events} />
      ) : (
        <EventMap events={events} />
      )}
    </main>
  )
}