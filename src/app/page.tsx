import { prisma } from '@/lib/prisma';

export default async function Home() {
  const events = await prisma.event.findMany();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
      {events.length === 0 ? (
        <p>No events found. Time to add one!</p>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <div key={event.id} className="border rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="text-gray-600">{event.description}</p>
              <p className="text-sm text-gray-400">{event.location}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {event.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}