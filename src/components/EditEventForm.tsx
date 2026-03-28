'use client'

import { updateEvent } from '@/app/events/action'
import { Event } from '@prisma/client'
import { useState } from 'react'

const CATEGORIES = [
  'OUTDOOR', 'MUSIC', 'SPORTS', 'FOOD', 'TECH', 'ARTS', 'CHARITY', 'OTHER',
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          name="title"
          type="text"
          required
          defaultValue={event.title}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={event.description}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          name="location"
          type="text"
          required
          defaultValue={event.location}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            name="lat"
            type="number"
            step="any"
            required
            defaultValue={event.lat}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            name="lng"
            type="number"
            step="any"
            required
            defaultValue={event.lng}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          name="category"
          required
          defaultValue={event.category}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            name="startTime"
            type="datetime-local"
            required
            defaultValue={formatDateTime(event.startTime)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time <span className="text-gray-400">(optional)</span></label>
          <input
            name="endTime"
            type="datetime-local"
            defaultValue={event.endTime ? formatDateTime(event.endTime) : ''}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL <span className="text-gray-400">(optional)</span></label>
        <input
          name="imageUrl"
          type="url"
          defaultValue={event.imageUrl || ''}
          placeholder="https://..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>

    </form>
  )
}