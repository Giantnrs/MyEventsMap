import { prisma } from "@/lib/prisma"
import HomeClient from "@/components/HomeClient"
import { getUserSavedIds } from "@/app/saved/actions"
export const revalidate = 0

export default async function Page() {
  const [events, savedIds] = await Promise.all([
    prisma.event.findMany(),
    getUserSavedIds(),
  ])

  return <HomeClient events={events} savedIds={savedIds} />
}
