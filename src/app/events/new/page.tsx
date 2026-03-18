'use client'

import { createEvent } from "@/app/events/action"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const CATEGORIES = [
  'OUTDOOR',
  'MUSIC', 
  'SPORTS',
  'FOOD',
  'TECH',
  'ARTS',
  'CHARITY',
  'OTHER',
]

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      await createEvent({
        title:       formData.get('title') as string,
        description: formData.get('description') as string,
        location:    formData.get('location') as string,
        lat:         parseFloat(formData.get('lat') as string),
        lng:         parseFloat(formData.get('lng') as string),
        category:    formData.get('category') as string,
        startTime:   new Date(formData.get('startTime') as string),
        endTime:     formData.get('endTime') 
                       ? new Date(formData.get('endTime') as string) 
                       : undefined,
      })
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h1>Create New Event</h1>

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label><br />
          <input name="title" type="text" required style={{ width: '100%' }} />
        </div>
        <br />

        <div>
          <label>Description</label><br />
          <textarea name="description" required style={{ width: '100%' }} rows={4} />
        </div>
        <br />

        <div>
          <label>Location</label><br />
          <input name="location" type="text" required style={{ width: '100%' }} />
        </div>
        <br />

        <div>
          <label>Latitude</label><br />
          <input name="lat" type="number" step="any" required defaultValue="-37.7928" style={{ width: '100%' }} />
        </div>
        <br />

        <div>
          <label>Longitude</label><br />
          <input name="lng" type="number" step="any" required defaultValue="175.2783" style={{ width: '100%' }} />
        </div>
        <br />

        <div>
          <label>Category</label><br />
          <select name="category" required style={{ width: '100%' }}>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <br />

        <div>
          <label>Start Time</label><br />
          <input name="startTime" type="datetime-local" required style={{ width: '100%' }} />
        </div>
        <br />

        <div>
          <label>End Time (optional)</label><br />
          <input name="endTime" type="datetime-local" style={{ width: '100%' }} />
        </div>
        <br />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </main>
  )
}