import { prisma } from '@/lib/prisma'
import EventsTable from '@/components/admin/EventsTable'

export const revalidate = 0

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startTime: 'desc' },
    include: {
      author: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  })

  return <EventsTable events={events} />
}