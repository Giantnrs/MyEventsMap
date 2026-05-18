import { getSavedEvents, getMyEvents } from '@/app/saved/actions'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart, Pencil } from 'lucide-react'
import HeartButton from '@/components/HeartButton'
import { ExportOneButton, ExportAllButton } from '@/components/ExportButton'
import EventList from '@/components/EventList'

export default async function SavedPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const [saved, myEvents] = await Promise.all([
    getSavedEvents(),
    getMyEvents(),
  ])
  const events = saved.map(s => s.event)

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">

      {/* ── Saved Events ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
            <Heart size={18} className="fill-red-500 stroke-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Events</h1>
            <p className="text-sm text-gray-500">
              {events.length} event{events.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>
        {events.length > 0 && <ExportAllButton events={events} />}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl mb-12">
          <Heart size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No saved events yet</p>
          <p className="text-sm text-gray-400 mt-1">Tap the heart on any event to save it here</p>
          <Link href="/">
            <button className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Browse Events
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {events.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {event.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <ExportOneButton event={event} />
                      <HeartButton eventId={event.id} initialSaved={true} />
                    </div>
                  </div>
                  <h2 className="text-base font-semibold mt-2 text-gray-900">{event.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    🕐 {event.startTime.toLocaleDateString('en-NZ', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── My Events ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <Pencil size={18} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
          <p className="text-sm text-gray-500">
            {myEvents.length} event{myEvents.length !== 1 ? 's' : ''} created
          </p>
        </div>
      </div>

      {myEvents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Pencil size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">You haven't created any events yet</p>
          <Link href="/events/new">
            <button className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Create an Event
            </button>
          </Link>
        </div>
      ) : (
        <EventList events={myEvents} savedIds={events.map(e => e.id)} />
      )}

    </main>
  )
}