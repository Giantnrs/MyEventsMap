'use client'

import dynamic from 'next/dynamic'

const EventLocationMap = dynamic(() => import('./EventLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 animate-pulse h-[280px]" />
  ),
})

export default EventLocationMap
