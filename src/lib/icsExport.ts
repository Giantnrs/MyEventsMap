import { Event } from "@prisma/client"

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function eventToVEvent(event: Event): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.id}@myeventsmap`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(event.startTime)}`,
    event.endTime
      ? `DTEND:${formatIcsDate(event.endTime)}`
      : `DTEND:${formatIcsDate(new Date(event.startTime.getTime() + 60 * 60 * 1000))}`, // default 1hr
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    `GEO:${event.lat};${event.lng}`,
    'END:VEVENT',
  ]
  return lines.join('\r\n')
}

function buildIcs(events: Event[]): string {
  const vevents = events.map(eventToVEvent).join('\r\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MyEventsMap//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(events: Event[], filename = 'events.ics') {
  const content = buildIcs(events)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
