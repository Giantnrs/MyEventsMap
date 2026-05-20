import { redirect } from 'next/navigation'
import { getIsAdmin } from '@/lib/isAdmin'
import AdminNav from '@/components/admin/AdminNav'
import { Shield } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getIsAdmin()
  if (!admin) redirect('/')

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Moderation &amp; management tools</p>
        </div>
      </div>
      <AdminNav />
      {children}
    </div>
  )
}
