"use client"
import { Event } from "@prisma/client"
export default function EventMap({ events }: { events: Event[] }) {
  return (
    <div>
      Map showing {events.length} events
    </div>
  )
}