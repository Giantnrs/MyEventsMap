'use client'

import { updateEvent } from '@/app/events/action'
import { Event } from '@prisma/client'
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

const formatDateTime = (date: Date) => {
  return new Date(date).toISOString().slice(0, 16)
}

export default function EditEventForm({ event }: { event: Event }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      await updateEvent(event.id, {
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
        imageUrl:    formData.get('imageUrl') as string || undefined,
      })
      setLoading(false)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      <div>
        <label>Title</label><br />
        <input
          name="title"
          type="text"
          required
          defaultValue={event.title}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <div>
        <label>Description</label><br />
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={event.description}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <div>
        <label>Location</label><br />
        <input
          name="location"
          type="text"
          required
          defaultValue={event.location}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <div>
        <label>Latitude</label><br />
        <input
          name="lat"
          type="number"
          step="any"
          required
          defaultValue={event.lat}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <div>
        <label>Longitude</label><br />
        <input
          name="lng"
          type="number"
          step="any"
          required
          defaultValue={event.lng}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <div>
        <label>Category</label><br />
        <select
          name="category"
          required
          defaultValue={event.category}
          style={{ width: '100%' }}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <br />

      <div>
        <label>Start Time</label><br />
        <input
          name="startTime"
          type="datetime-local"
          required
          defaultValue={formatDateTime(event.startTime)}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <div>
        <label>End Time (optional)</label><br />
        <input
          name="endTime"
          type="datetime-local"
          defaultValue={event.endTime ? formatDateTime(event.endTime) : ''}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <div>
        <label>Image URL (optional)</label><br />
        <input
          name="imageUrl"
          type="url"
          defaultValue={event.imageUrl || ''}
          style={{ width: '100%' }}
        />
      </div>
      <br />

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}