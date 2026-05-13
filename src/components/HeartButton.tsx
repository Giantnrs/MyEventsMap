'use client'

import { useState, useTransition } from 'react'
import { Bookmark } from 'lucide-react'
import { toggleSave } from '@/app/saved/actions'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function HeartButton({
  eventId,
  initialSaved,
}: {
  eventId: string
  initialSaved: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()
  const { data: session } = useSession()
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()  // don't trigger parent <Link>
    e.stopPropagation()

    if (!session) {
      router.push('/api/auth/signin')
      return
    }

    setSaved(prev => !prev) // optimistic
    startTransition(async () => {
      try {
        await toggleSave(eventId)
      } catch {
        setSaved(prev => !prev) // revert on error
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={saved ? 'Remove from saved' : 'Save event'}
      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      <Bookmark
        size={18}
        className={`transition-colors ${
          saved ? 'fill-blue-600 stroke-blue-600' : 'stroke-gray-400 hover:stroke-blue-600'
        }`}
      />
    </button>
  )
}
