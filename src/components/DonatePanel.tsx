'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'

const PRESETS = [5, 10, 20, 50]

export default function DonatePanel({
  eventId,
  raised,
  count,
}: {
  eventId: string
  raised: number   // in cents
  count: number
}) {
  const [amount, setAmount] = useState<number | ''>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const raisedDollars = raised / 100

  async function handleDonate() {
    if (!amount || Number(amount) < 1) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/donate/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 border border-rose-100 bg-rose-50 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
          <Heart size={16} className="fill-rose-500 stroke-rose-500" />
        </div>
        <h2 className="font-semibold text-gray-900">Support this event</h2>
      </div>

      {/* Stats */}
      <div className="mb-5">
        <p className="text-2xl font-bold text-gray-900">
          ${raisedDollars.toFixed(2)}
          <span className="text-base font-normal text-gray-500 ml-1">raised</span>
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {count} donation{count !== 1 ? 's' : ''} so far
        </p>
      </div>

      {/* Preset amounts */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {PRESETS.map(preset => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              amount === preset
                ? 'bg-rose-500 text-white border-rose-500'
                : 'border-gray-300 text-gray-600 hover:bg-white'
            }`}
          >
            ${preset}
          </button>
        ))}
      </div>

      {/* Custom amount + donate button */}
      <div className="flex gap-2 items-center mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            placeholder="Custom amount"
          />
        </div>
        <button
          onClick={handleDonate}
          disabled={loading || !amount || Number(amount) < 1}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : <Heart size={15} />
          }
          Donate
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-2">{error}</p>
      )}

      <p className="text-xs text-gray-400">Secured by Stripe · NZD</p>
    </div>
  )
}
