'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function getUserSavedIds(): Promise<string[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const saved = await prisma.savedEvent.findMany({
    where: { userId: session.user.id },
    select: { eventId: true },
  })
  return saved.map(s => s.eventId)
}

export async function getSavedEvents() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  return prisma.savedEvent.findMany({
    where: { userId: session.user.id },
    include: { event: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function toggleSave(eventId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const existing = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId } },
  })

  if (existing) {
    await prisma.savedEvent.delete({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    })
  } else {
    await prisma.savedEvent.create({
      data: { userId: session.user.id, eventId },
    })
  }

  revalidatePath('/')
  revalidatePath('/saved')
}
