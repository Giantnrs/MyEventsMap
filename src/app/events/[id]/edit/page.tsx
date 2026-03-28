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
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Event</h1>
      <p className="text-gray-500 mb-8">Update the details below.</p>
      <EditEventForm event={event} />
    </main>
  )
}