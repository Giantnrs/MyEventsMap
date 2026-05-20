'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getIsAdmin } from '@/lib/isAdmin'

async function requireAdmin() {
  const ok = await getIsAdmin()
  if (!ok) throw new Error('Unauthorized')
}

export async function setEventFlagged(id: string, flagged: boolean) {
  await requireAdmin()
  await prisma.event.update({ where: { id }, data: { flagged } })
  revalidatePath('/admin/events')
}

export async function adminDeleteEvent(id: string) {
  await requireAdmin()
  await prisma.event.delete({ where: { id } })
  revalidatePath('/admin/events')
}

export async function setUserBanned(id: string, banned: boolean) {
  await requireAdmin()
  await prisma.user.update({ where: { id }, data: { banned } })
  revalidatePath('/admin/users')
}
