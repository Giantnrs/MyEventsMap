import { prisma } from "@/lib/prisma"
import HomeClient from "@/components/HomeClient"
import { getUserSavedIds } from "@/app/saved/actions"
import { fetchWeather, WeatherData } from "@/lib/weather"
export const revalidate = 0

export default async function Page() {
  const [events, savedIds] = await Promise.all([
    prisma.event.findMany({ where: { flagged: false, startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' } }),
    getUserSavedIds(),
  ])

  // Deduplicate fetches — many events share the same location (e.g. library branches)
  const cache = new Map<string, WeatherData | null>()
  async function cachedWeather(lat: number, lng: number, date: Date): Promise<WeatherData | null> {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${date.toISOString().slice(0, 10)}`
    if (!cache.has(key)) cache.set(key, await fetchWeather(lat, lng, date))
    return cache.get(key)!
  }

  const weatherEntries = await Promise.all(
    events.map(async e => [e.id, await cachedWeather(e.lat, e.lng, e.startTime)] as const)
  )
  const weatherMap = Object.fromEntries(weatherEntries) as Record<string, WeatherData | null>

  return <HomeClient events={events} savedIds={savedIds} weatherMap={weatherMap} />
}
