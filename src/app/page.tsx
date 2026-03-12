import { prisma } from "@/lib/prisma"
import HomeClient from "@/components/HomeClient"

export default async function Page() {
  const events = await prisma.event.findMany()

  return <HomeClient events={events} />
}