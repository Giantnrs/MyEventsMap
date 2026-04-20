'use client'

import { Plus, LogIn, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 h-16 flex items-center px-6 justify-between shadow-sm">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">
          MyEventsMap
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {session && (
          <Link href="/events/new">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={16} />
              <span className="hidden sm:block">Create Event</span>
            </button>
          </Link>
        )}

        {session ? (
          <div className="flex items-center gap-3">

            {/* Avatar — links to saved page */}
            <Link href="/saved" title="Saved events">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                  className="w-10 h-10 rounded-full border-2 border-transparent hover:border-blue-400 transition-colors"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold hover:bg-blue-700 transition-colors">
                  {session.user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('google', {}, { prompt: 'select_account' })}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <LogIn size={16} />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </nav>
  )
}
