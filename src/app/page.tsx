import { prisma } from '@/lib/prisma';

export default async function Home() {
  // This is a Server Component. It fetches data directly from the DB!
  const events = await prisma.event.findMany();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Upcoming Events</h1>
      {events.length === 0 ? (
        <p>No events found. Time to add one!</p>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <div key={events.id}>{events.title}</div>
          ))}
        </div>
      )}
    </main>
  );
}