export interface WeatherData {
  tempMin: number
  tempMax: number
  weatherCode: number
  precipitation: number
}

export interface WeatherInfo {
  label: string
  icon: 'Sun' | 'Cloud' | 'CloudRain' | 'CloudSnow' | 'CloudDrizzle' | 'Zap' | 'CloudFog'
}

export function weatherInfo(code: number): WeatherInfo {
  if (code === 0)                                    return { label: 'Clear sky',     icon: 'Sun' }
  if (code <= 3)                                     return { label: 'Partly cloudy', icon: 'Cloud' }
  if (code <= 48)                                    return { label: 'Foggy',         icon: 'CloudFog' }
  if (code <= 55)                                    return { label: 'Drizzle',       icon: 'CloudDrizzle' }
  if (code <= 67)                                    return { label: 'Rain',          icon: 'CloudRain' }
  if (code <= 77)                                    return { label: 'Snow',          icon: 'CloudSnow' }
  if (code <= 82)                                    return { label: 'Rain showers',  icon: 'CloudRain' }
  if (code <= 86)                                    return { label: 'Snow showers',  icon: 'CloudSnow' }
  if (code === 95 || code === 96 || code === 99)     return { label: 'Thunderstorm',  icon: 'Zap' }
  return { label: 'Unknown', icon: 'Cloud' }
}

export async function fetchWeather(
  lat: number,
  lng: number,
  date: Date,
): Promise<WeatherData | null> {
  const now = new Date()
  const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

  // More than 16 days in the future — no forecast available yet
  if (diffDays > 16) return null

  // Estimate the local date at the event's longitude (15° ≈ 1 hour offset).
  // This avoids fetching the wrong day when the server runs in UTC.
  const estimatedOffsetMs = Math.round(lng / 15) * 3600 * 1000
  const localDate = new Date(date.getTime() + estimatedOffsetMs)
  const dateStr = localDate.toISOString().slice(0, 10)
  const params =
    `latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum` +
    `&start_date=${dateStr}&end_date=${dateStr}` +
    `&timezone=auto`

  // Archive API lags ~1 day behind — use it only for events clearly in the past.
  // Forecast API covers today and a couple of days back, so use it for recent/future.
  const base = diffDays < -2
    ? 'https://archive-api.open-meteo.com/v1/era5'
    : 'https://api.open-meteo.com/v1/forecast'

  try {
    const res = await fetch(`${base}?${params}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    const daily = json?.daily
    if (!daily?.weathercode) return null

    return {
      tempMin:       Math.round(daily.temperature_2m_min[0]),
      tempMax:       Math.round(daily.temperature_2m_max[0]),
      weatherCode:   daily.weathercode[0],
      precipitation: Math.round(daily.precipitation_sum[0] ?? 0),
    }
  } catch {
    return null
  }
}
