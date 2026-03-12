export default function EventList({ events }) {
  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <div key={event.id} className="border rounded-lg p-4">
          <h2>{event.title}</h2>
          <p>{event.description}</p>
        </div>
      ))}
    </div>
  )
}