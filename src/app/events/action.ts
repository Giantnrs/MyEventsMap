'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Category } from "@prisma/client"

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
  try {
    const event = await prisma.event.create({
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
        authorId: "cmmsd62wq0000dvg2sjh3qoy9", // TODO: Replace with session user ID
      }
    })
    revalidatePath("/events")
    
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create event')
  }
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
  try {
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
    
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update event')
  }
  redirect(`/events/${id}`)
}

export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({
      where: { id }
    })
    revalidatePath("/events")

  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete event')
  }
  redirect("/events")
}