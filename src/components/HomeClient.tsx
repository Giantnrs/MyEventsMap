"use client"
import { Event } from "@prisma/client"
import { useState } from "react"
import Navbar from "./Navbar"
import EventList from "@/components/EventList"
import EventMap from "@/components/EventMap"

export default function HomeClient({ events }: { events:Event[] }) {
  const [view, setView] = useState<"list" | "map">("list")

  return (
    <main className="pt-24">
      <Navbar view={view} setView={setView} />

      {view === "list" ? (
        <EventList events={events} />
      ) : (
        <EventMap events={events} />
      )}
    </main>
  )
}