'use client'

import { Event } from "@prisma/client"
import { CalendarArrowDown } from "lucide-react"
import { downloadIcs } from "@/lib/icsExport"

export function ExportOneButton({ event }: { event: Event }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        downloadIcs([event], `${event.title.replace(/\s+/g, '-')}.ics`)
      }}
      title="Export to calendar"
      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-500"
    >
      <CalendarArrowDown size={17} />
    </button>
  )
}

export function ExportAllButton({ events }: { events: Event[] }) {
  return (
    <button
      onClick={() => downloadIcs(events, 'my-saved-events.ics')}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
    >
      <CalendarArrowDown size={16} />
      Export all to calendar
    </button>
  )
}
