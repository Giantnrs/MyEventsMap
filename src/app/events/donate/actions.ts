'use server'

import { prisma } from '@/lib/prisma'

export async function getEventDonations(eventId: string): Promise<{
  total: number
  count: number
}> {
  try {
    const donations = await prisma.donation.findMany({
      where: { eventId, status: 'paid' },
      select: { amount: true },
    })

    const total = donations.reduce((sum, d) => sum + d.amount, 0)
    return { total, count: donations.length }
  } catch (error) {
    console.error('Failed to fetch donations:', error)
    return { total: 0, count: 0 }
  }
}
