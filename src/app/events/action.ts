'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Category } from "@prisma/client"
import { auth } from "@/lib/auth"

export async function getEvents() {
  try {
    return await prisma.event.findMany({
      orderBy: { startTime: 'asc' }
    })
  } catch (error) {
    console.error(error)
    throw new Error('Failed to fetch events')
  }
}

export async function getEvent(id: string) {
  try {
    return await prisma.event.findUnique({
      where: { id }
    })
  } catch (error) {
    console.error(error)
    throw new Error('Failed to fetch event')
  }
}

export async function createEvent(data: {
  title: string
  description: string
  location: string
  lat: number
  lng: number
  startTime: Date
  endTime?: Date
  category: string
  imageUrl?: string
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      category: data.category as Category,
      startTime: data.startTime,
      endTime: data.endTime,
      imageUrl: data.imageUrl ?? "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      authorId: session.user.id,
    }
  })

  revalidatePath("/events")
  redirect("/events/")
}

export async function updateEvent(id: string, data: {
  title: string
  description: string
  location: string
  lat: number
  lng: number
  startTime: Date
  endTime?: Date
  category: string
  imageUrl?: string
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) throw new Error('Event not found')
  if (event.authorId !== session.user.id) throw new Error('Unauthorized')

  await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      category: data.category as Category,
      startTime: data.startTime,
      endTime: data.endTime,
      imageUrl: data.imageUrl,
    }
  })

  revalidatePath("/events")
  redirect(`/events/${id}`)
}

export async function deleteEvent(id: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) throw new Error('Event not found')
  if (event.authorId !== session.user.id) throw new Error('Unauthorized')

  await prisma.event.delete({ where: { id } })

  revalidatePath("/events")
  redirect("/events")
}