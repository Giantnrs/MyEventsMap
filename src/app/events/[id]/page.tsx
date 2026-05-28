import { getEvent } from '@/app/events/action'
import { notFound } from 'next/navigation'
import { deleteEvent } from '@/app/events/action'
import { getEventDonations } from '@/app/events/donate/actions'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Category } from '@prisma/client'
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Zap, CloudFog } from 'lucide-react'
import DonatePanel from '@/components/DonatePanel'
import EventLocationMap from '@/components/EventLocationMapClient'
import { fetchWeather, weatherInfo } from '@/lib/weather'

const WEATHER_ICONS = { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Zap, CloudFog }

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ donated?: string }>
}) {
  const { id } = await params
  const { donated } = await searchParams

  const [event, session, { total, count }] = await Promise.all([
    getEvent(id),
    auth(),
    getEventDonations(id),
  ])

  if (!event) {
    notFound()
  }

  const weather = await fetchWeather(event.lat, event.lng, event.startTime)
  const weatherDisplay = weather ? weatherInfo(weather.weatherCode) : null
  const WeatherIcon = weatherDisplay ? WEATHER_ICONS[weatherDisplay.icon] : null

  const isOwner = session?.user?.id === event.authorId

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">

      {/* Success banner */}
      {donated === '1' && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          🎉 Thank you for your donation! It means a lot to the organiser.
        </div>
      )}

      {/* Event Image */}
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-72 object-cover rounded-2xl"
        />
      )}

      {/* Category Badge */}
      <div className="mt-5">
        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {event.category}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mt-3">
        {event.title}
      </h1>

      {/* Meta info */}
      <div className="mt-4 flex flex-col gap-2">
        <p className="text-gray-600 flex items-center gap-2">
          <span>📍</span>
          <span>{event.location}</span>
        </p>
        <p className="text-gray-600 flex items-center gap-2">
          <span>🕐</span>
          <span>{event.startTime.toLocaleDateString('en-NZ', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</span>
        </p>
        {event.endTime && (
          <p className="text-gray-600 flex items-center gap-2">
            <span>🏁</span>
            <span>Ends: {event.endTime.toLocaleDateString('en-NZ', {
              hour: '2-digit',
              minute: '2-digit',
            })}</span>
          </p>
        )}
      </div>

      {/* Weather forecast */}
      {weather && weatherDisplay && WeatherIcon && (
        <div className="mt-4 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <WeatherIcon size={22} className="shrink-0 text-blue-500" />
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-none mb-1">
              Weather forecast
            </p>
            <p className="text-sm text-gray-700">
              {weatherDisplay.label} · {weather.tempMin}–{weather.tempMax}°C
              {weather.precipitation > 0 && ` · ${weather.precipitation}mm rain`}
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Description */}
      <p className="text-gray-700 leading-relaxed text-base">
        {event.description}
      </p>

      {/* Location map */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Location
        </h2>
        <EventLocationMap lat={event.lat} lng={event.lng} label={event.location} />
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs text-blue-500 hover:underline"
        >
          Open in Google Maps ↗
        </a>
      </div>

      {/* Donation panel — charity events only */}
      {event.category === Category.CHARITY && (
        <DonatePanel
          eventId={id}
          raised={total}
          count={count}
        />
      )}

      {/* Actions — owner only */}
      {isOwner && (
        <div className="flex gap-3 mt-10">
          <Link href={`/events/${id}/edit`}>
            <button className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Edit Event
            </button>
          </Link>

          <form action={deleteEvent.bind(null, id)}>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Delete Event
            </button>
          </form>
        </div>
      )}

    </main>
  )
}
