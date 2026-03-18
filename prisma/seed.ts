import "dotenv/config"
import { Category, PrismaClient, Role } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding...')

  // Clean up existing data in correct order (respecting foreign keys)
  await prisma.savedEvent.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Bin Huang',
      email: 'bin@example.com',
      role: Role.ADMIN,
    }
  })

  // Create a regular test user
  const testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      role: Role.USER,
    }
  })

  console.log(`Created users: ${admin.email}, ${testUser.email}`)

  // Create events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Hamilton Lake Parkrun',
        description: 'A free, weekly, 5km timed run around the beautiful Hamilton Lake.',
        location: 'Hamilton Lake Domain',
        lat: -37.7928,
        lng: 175.2783,
        category: Category.OUTDOOR,
        startTime: new Date('2025-04-05T08:00:00'),
        endTime: new Date('2025-04-05T10:00:00'),
        imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
        authorId: admin.id,
      }
    }),
    prisma.event.create({
      data: {
        title: 'Waikato Museum Exhibition',
        description: 'Exploring the history and art of the Tainui people and the Waikato region.',
        location: '1 Grantham Street, Hamilton',
        lat: -37.7901,
        lng: 175.2848,
        category: Category.ARTS,
        startTime: new Date('2025-04-10T09:00:00'),
        endTime: new Date('2025-04-10T17:00:00'),
        imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
        authorId: admin.id,
      }
    }),
    prisma.event.create({
      data: {
        title: 'Hamilton Tech Meetup',
        description: 'Monthly meetup for local developers and tech enthusiasts. All skill levels welcome.',
        location: 'Generator Hamilton, CBD',
        lat: -37.7870,
        lng: 175.2793,
        category: Category.TECH,
        startTime: new Date('2025-04-15T18:00:00'),
        endTime: new Date('2025-04-15T20:30:00'),
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
        authorId: admin.id,
      }
    }),
    prisma.event.create({
      data: {
        title: 'Waikato River Charity Cleanup',
        description: 'Join us to help clean up the Waikato River banks. Equipment provided.',
        location: 'Flagstaff Bridge, Hamilton',
        lat: -37.7955,
        lng: 175.2820,
        category: Category.CHARITY,
        startTime: new Date('2025-04-20T09:00:00'),
        endTime: new Date('2025-04-20T12:00:00'),
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        authorId: testUser.id,
      }
    }),
    prisma.event.create({
      data: {
        title: 'Hamilton Food & Wine Festival',
        description: 'Sample delicious food and wine from local vendors across the Waikato region.',
        location: 'Claudelands Events Centre',
        lat: -37.8012,
        lng: 175.2934,
        category: Category.FOOD,
        startTime: new Date('2025-05-03T11:00:00'),
        endTime: new Date('2025-05-03T20:00:00'),
        imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
        authorId: testUser.id,
      }
    }),
  ])

  console.log(`Created ${events.length} events`)

  // Create some saved events (testUser saves admin's events)
  await prisma.savedEvent.createMany({
    data: [
      { userId: testUser.id, eventId: events[0].id },
      { userId: testUser.id, eventId: events[2].id },
      { userId: admin.id,    eventId: events[3].id },
    ]
  })

  console.log('Created saved events')
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