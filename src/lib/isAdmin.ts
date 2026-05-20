import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getIsAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  return user?.role === 'ADMIN'
}