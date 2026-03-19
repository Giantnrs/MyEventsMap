import { getEvent } from '@/app/events/action'
import { notFound } from 'next/navigation'
import EditEventForm from '@/components/EditEventForm'

export default async function EditEventPage({
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
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h1>Edit Event</h1>
      <EditEventForm event={event} />
    </main>
  )
}