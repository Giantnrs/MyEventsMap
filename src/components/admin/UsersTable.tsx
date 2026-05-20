'use client'

import { useState, useTransition, useMemo } from 'react'
import { setUserBanned } from '@/app/admin/actions'
import { Ban, CheckCircle, Loader2 } from 'lucide-react'

type UserWithCount = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  banned: boolean
  createdAt: Date
  _count: { events: number }
}

export default function UsersTable({ users }: { users: UserWithCount[] }) {
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all')
  const [sortBy, setSortBy]           = useState<'joined' | 'events'>('joined')
  const [loadingId, setLoadingId]     = useState<string | null>(null)
  const [, startTransition]           = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let result = users.filter(u => {
      if (q && !(u.name ?? '').toLowerCase().includes(q) && !(u.email ?? '').toLowerCase().includes(q)) return false
      if (filterStatus === 'active' && u.banned)  return false
      if (filterStatus === 'banned' && !u.banned) return false
      return true
    })

    result = [...result].sort((a, b) =>
      sortBy === 'events'
        ? b._count.events - a._count.events
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return result
  }, [users, search, filterStatus, sortBy])

  function handleBan(user: UserWithCount) {
    const action = user.banned ? 'Unban' : 'Ban'
    const msg = user.banned
      ? `Unban ${user.name ?? 'this user'}? They'll be able to create events again.`
      : `Ban ${user.name ?? 'this user'}? They won't be able to create new events.`
    if (!confirm(msg)) return

    setLoadingId(user.id)
    startTransition(async () => {
      await setUserBanned(user.id, !user.banned)
      setLoadingId(null)
    })
  }

  const bannedCount = users.filter(u => u.banned).length

  return (
    <div>
      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 min-w-[100px]">
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total users</p>
        </div>
        <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-100 min-w-[100px]">
          <p className="text-2xl font-bold text-green-600">{users.length - bannedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active</p>
        </div>
        <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-100 min-w-[100px]">
          <p className="text-2xl font-bold text-red-600">{bannedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Banned</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <div className="flex gap-1">
          {(['all', 'active', 'banned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                filterStatus === f
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'joined' | 'events')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="joined">Sort: Newest joined</option>
          <option value="events">Sort: Most events</option>
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''} shown</p>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Events</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    No users match your filters
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 transition-colors ${user.banned ? 'bg-red-50/30' : ''}`}
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-blue-600 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold">
                            {user.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name ?? '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Event count */}
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${user._count.events > 5 ? 'text-blue-600' : 'text-gray-700'}`}>
                        {user._count.events}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">event{user._count.events !== 1 ? 's' : ''}</span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-NZ', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.banned ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-600 px-2 py-1 rounded-full whitespace-nowrap">
                          <Ban size={10} /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded-full whitespace-nowrap">
                          <CheckCircle size={10} /> Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {loadingId === user.id ? (
                          <Loader2 size={16} className="animate-spin text-gray-400" />
                        ) : (
                          <button
                            onClick={() => handleBan(user)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              user.banned
                                ? 'border-green-200 text-green-600 hover:bg-green-50'
                                : 'border-red-200 text-red-500 hover:bg-red-50'
                            }`}
                          >
                            {user.banned ? (
                              <><CheckCircle size={12} /> Unban</>
                            ) : (
                              <><Ban size={12} /> Ban</>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
