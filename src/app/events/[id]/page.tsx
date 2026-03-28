import { getEvent } from '@/app/events/action'
import { notFound } from 'next/navigation'
import { deleteEvent } from '@/app/events/action'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function EventDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const event = await getEvent(id)
  const session = await auth()

  if (!event) {
    notFound()
  }

  const isOwner = session?.user?.id === event.authorId

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">

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

      {/* Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Description */}
      <p className="text-gray-700 leading-relaxed text-base">
        {event.description}
      </p>

      {/* Actions — only visible to owner */}
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