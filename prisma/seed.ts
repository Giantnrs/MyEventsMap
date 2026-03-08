import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const events = [
    {
      title: "Hamilton Lake Parkrun",
      description: "A free, weekly, 5km timed run around the beautiful Hamilton Lake.",
      location: "Hamilton Lake Domain",
      lat: -37.7928,
      lng: 175.2783,
      category: "Outdoor",
      imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Waikato Museum Exhibition",
      description: "Exploring the history and art of the Tainui people and the Waikato region.",
      location: "1 Grantham Street, Hamilton",
      lat: -37.7901,
      lng: 175.2848,
      category: "Tech",
      imageUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80"
    }
  ]

  for (const event of events) {
    const createdEvent = await prisma.event.create({
      data: event,
    })
    console.log(`Created event with id: ${createdEvent.id}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })