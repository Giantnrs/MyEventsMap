'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users } from 'lucide-react'

const links = [
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/users',  label: 'Users',  icon: Users },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-8">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
