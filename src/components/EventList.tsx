import { Event } from "@prisma/client"
import Link from "next/link"
import { MapPin, Clock, Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Zap, CloudFog, CalendarDays } from "lucide-react"
import HeartButton from "@/components/HeartButton"
import { weatherInfo } from "@/lib/weather"
import type { WeatherData } from "@/lib/weather"

const WEATHER_ICONS = { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Zap, CloudFog }

export default function EventList({
  events,
  savedIds = [],
  weatherMap = {},
}: {
  events: Event[]
  savedIds?: string[]
  weatherMap?: Record<string, WeatherData | null>
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
      {events.map((event) => {
        const weather = weatherMap[event.id] ?? null
        const wInfo   = weather ? weatherInfo(weather.weatherCode) : null
        const WIcon   = wInfo ? WEATHER_ICONS[wInfo.icon] : null

        return (
          <Link key={event.id} href={`/events/${event.id}`}>
            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">

              {/* Image */}
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <CalendarDays size={40} className="text-indigo-200" />
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

                {/* Location + date (left) · Weather (right) */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                      <Clock size={13} className="shrink-0" />
                      {event.startTime.toLocaleDateString('en-NZ', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Weather — right column, shifted slightly inward */}
                  {weather && WIcon && (
                    <div className="flex flex-col items-center shrink-0 text-center mr-3">
                      <WIcon size={22} className="text-blue-400" />
                      <span className="text-xs font-medium text-gray-600 mt-0.5 whitespace-nowrap">
                        {weather.tempMin}–{weather.tempMax}°C
                      </span>
                      {weather.precipitation > 0 && (
                        <span className="text-xs text-gray-400">{weather.precipitation}mm</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Description preview */}
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {event.description}
                </p>

              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
