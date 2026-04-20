import { Event } from "@prisma/client"
import Link from "next/link"
import HeartButton from "@/components/HeartButton"

export default function EventList({
  events,
  savedIds = [],
}: {
  events: Event[]
  savedIds?: string[]
}) {

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">No events found.</p>
        <Link href="/events/new">
          <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">
            Create First Event
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {events.map((event) => (
        <Link key={event.id} href={`/events/${event.id}`}>
          <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">

            {/* Image */}
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}

            {/* Content */}
            <div className="p-4">

              {/* Category badge + heart */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {event.category}
                </span>
                <HeartButton
                  eventId={event.id}
                  initialSaved={savedIds.includes(event.id)}
                />
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold mt-2 text-gray-900">
                {event.title}
              </h2>

              {/* Location */}
              <p className="text-sm text-gray-500 mt-1">
                📍 {event.location}
              </p>

              {/* Date */}
              <p className="text-sm text-gray-500 mt-1">
                🕐 {event.startTime.toLocaleDateString('en-NZ', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              {/* Description preview */}
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {event.description}
              </p>

            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
