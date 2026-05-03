import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { amount } = await req.json()

    if (!amount || isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const session = await auth()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    const checkout = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'nzd',
            product_data: {
              name: `Donation to: ${event.title}`,
              description: event.description.slice(0, 200),
            },
            unit_amount: Math.round(amount * 100), // dollars → cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/events/${id}?donated=1`,
      cancel_url: `${baseUrl}/events/${id}`,
      metadata: {
        eventId: id,
        userId: session?.user?.id ?? '',
      },
    })

    await prisma.donation.create({
      data: {
        eventId: id,
        userId: session?.user?.id ?? null,
        amount: Math.round(amount * 100),
        stripeSessionId: checkout.id,
        status: 'pending',
      },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error('Donate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
