import { prisma } from '@/lib/prisma'
import UsersTable from '@/components/admin/UsersTable'

export const revalidate = 0

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      banned: true,
      createdAt: true,
      _count: { select: { events: true } },
    },
  })

  return <UsersTable users={users} />
}