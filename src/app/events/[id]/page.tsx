import { getEvent } from '@/app/events/action'
import { notFound } from 'next/navigation'
import { deleteEvent } from '@/app/events/action'
import Link from 'next/link'

export default async function EventDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      
      {/* Event Image */}
      {event.imageUrl && (
        <img 
          src={event.imageUrl} 
          alt={event.title}
          style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8 }}
        />
      )}

      {/* Category Badge */}
      <p style={{ marginTop: 16 }}>
        <span style={{ 
          background: '#e2e8f0', 
          padding: '4px 12px', 
          borderRadius: 999,
          fontSize: 12 
        }}>
          {event.category}
        </span>
      </p>

      {/* Title */}
      <h1 style={{ marginTop: 8 }}>{event.title}</h1>

      {/* Location */}
      <p>📍 {event.location}</p>

      {/* Time */}
      <p>🕐 {event.startTime.toLocaleDateString('en-NZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>

      {/* End Time (optional) */}
      {event.endTime && (
        <p>🏁 Ends: {event.endTime.toLocaleDateString('en-NZ', {
          hour: '2-digit',
          minute: '2-digit',
        })}</p>
      )}

      {/* Description */}
      <p style={{ marginTop: 16, lineHeight: 1.7 }}>{event.description}</p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        
        {/* Edit Button */}
        <Link href={`/events/${id}/edit`}>
          <button>Edit Event</button>
        </Link>

        {/* Delete Button */}
        <form action={deleteEvent.bind(null, id)}>
          <button 
            type="submit" 
            style={{ background: 'red', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer' }}
          >
            Delete Event
          </button>
        </form>

      </div>

    </main>
  )
}